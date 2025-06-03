#!/usr/bin/env python3
import tkinter as tk
from tkinter import ttk, messagebox
import asyncio
import websockets
import json
from datetime import datetime
import threading
import queue
import base64
from PIL import Image, ImageTk
import io
import re
import time

class HeadsupGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Headsup Control Panel")
        self.root.geometry("800x600")
        self.root.resizable(False, False)  # Disable window resizing

        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')  # Use clam theme as base

        # Configure colors for light theme
        self.bg_color = '#f5f5f5'  # Light gray background
        self.fg_color = '#333333'  # Dark gray text
        self.accent_color = '#007acc'  # Blue accent
        self.success_color = '#28a745'  # Green
        self.warning_color = '#ffc107'  # Yellow
        self.error_color = '#dc3545'  # Red
        self.disabled_color = '#cccccc'  # Light gray for disabled elements

        # Configure styles
        self.style.configure('TFrame', background=self.bg_color)
        self.style.configure('TLabel', background=self.bg_color, foreground=self.fg_color)
        self.style.configure('TButton',
                           background=self.accent_color,
                           foreground='white',
                           padding=5)
        self.style.map('TButton',
                      background=[('disabled', self.disabled_color),
                                ('active', '#005fa3')],  # Darker blue for hover
                      foreground=[('disabled', '#666666')])
        self.style.configure('TLabelframe',
                           background=self.bg_color,
                           foreground=self.fg_color)
        self.style.configure('TLabelframe.Label',
                           background=self.bg_color,
                           foreground=self.fg_color,
                           font=('Helvetica', 10, 'bold'))
        self.style.configure('Header.TLabel',
                           font=('Helvetica', 24, 'bold'),
                           foreground=self.fg_color)
        self.style.configure('Subheader.TLabel',
                           font=('Helvetica', 12),
                           foreground='#666666')  # Medium gray for subheader
        self.style.configure('Status.TLabel',
                           font=('Helvetica', 10, 'bold'))

        # Configure the root window
        self.root.configure(bg=self.bg_color)

        # WebSocket state
        self.websocket = None
        self.connected = False
        self.connecting = False
        self.connection_error = False
        self.message_queue = queue.Queue()
        self.ws_thread = None
        self.should_connect = False  # Flag to control connection attempts
        self.loop = None  # Store the event loop

        # Headset state
        self.device_name = "Offline"
        self.device_model = "Offline"
        self.device_battery = 0.0
        self.current_block = "Inactive"
        self.current_trial = 0
        self.total_trials = 0
        self.fixation_required = True
        self.screenshot_data = []

        self.setup_gui()
        self.setup_websocket_thread()

    def setup_gui(self):
        # Create main container with reduced padding
        main_frame = ttk.Frame(self.root, padding="12")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Header with reduced padding
        header_frame = ttk.Frame(main_frame)
        header_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 12))

        ttk.Label(header_frame, text="Headsup", style='Header.TLabel').grid(row=0, column=0)
        ttk.Label(header_frame, text="VR Experiment Control Panel", style='Subheader.TLabel').grid(row=1, column=0)

        # Connection frame with reduced padding
        conn_frame = ttk.LabelFrame(main_frame, text="Connection Status", padding="10")
        conn_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 12))

        # Status indicator frame with reduced padding
        status_indicator_frame = ttk.Frame(conn_frame)
        status_indicator_frame.grid(row=0, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 8))

        # Status indicator
        self.status_canvas = tk.Canvas(status_indicator_frame, width=14, height=14,
                                     bg=self.bg_color, highlightthickness=0)
        self.status_canvas.grid(row=0, column=0, padx=(0, 6))
        self.status_canvas.create_oval(2, 2, 12, 12, fill=self.disabled_color, tags='status_dot')

        self.status_label = ttk.Label(status_indicator_frame, text="Disconnected", style='Status.TLabel')
        self.status_label.grid(row=0, column=1, sticky=tk.W)

        # Connection controls with reduced padding
        controls_frame = ttk.Frame(conn_frame)
        controls_frame.grid(row=1, column=0, columnspan=5, sticky=(tk.W, tk.E))

        # IP Address with reduced padding
        ttk.Label(controls_frame, text="IP Address:").grid(row=0, column=0, padx=(0, 4))
        self.ip_var = tk.StringVar(value="localhost")
        self.ip_entry = ttk.Entry(controls_frame, textvariable=self.ip_var, width=20)
        self.ip_entry.grid(row=0, column=1, padx=(0, 12))

        # Port with reduced padding
        ttk.Label(controls_frame, text="Port:").grid(row=0, column=2, padx=(0, 4))
        self.port_var = tk.StringVar(value="4444")
        self.port_entry = ttk.Entry(controls_frame, textvariable=self.port_var, width=6)
        self.port_entry.grid(row=0, column=3, padx=(0, 12))

        # Connect button
        self.connect_btn = ttk.Button(controls_frame, text="Connect", command=self.toggle_connection)
        self.connect_btn.grid(row=0, column=4, padx=4)

        # Status and Screenshot container
        content_frame = ttk.Frame(main_frame)
        content_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        content_frame.columnconfigure(1, weight=1)
        content_frame.rowconfigure(0, weight=1)

        # Status frame with reduced padding
        status_frame = ttk.LabelFrame(content_frame, text="Device Status", padding="10")
        status_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 8))

        # Device info with reduced padding
        info_frame = ttk.Frame(status_frame)
        info_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 12))

        self.device_name_label = ttk.Label(info_frame, text="Name: Offline")
        self.device_name_label.grid(row=0, column=0, sticky=tk.W, pady=1)

        self.device_model_label = ttk.Label(info_frame, text="Model: Offline")
        self.device_model_label.grid(row=1, column=0, sticky=tk.W, pady=1)

        self.device_battery_label = ttk.Label(info_frame, text="Battery: Offline")
        self.device_battery_label.grid(row=2, column=0, sticky=tk.W, pady=1)

        # Experiment progress with reduced padding
        ttk.Label(status_frame, text="Experiment Progress").grid(row=1, column=0, sticky=tk.W, pady=(8, 4))
        self.progress_bar = ttk.Progressbar(status_frame, length=200, mode='determinate', style='TProgressbar')
        self.progress_bar.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 4))

        self.trial_label = ttk.Label(status_frame, text="Trial: 0 / 0 (0%)")
        self.trial_label.grid(row=3, column=0, sticky=tk.W, pady=(0, 4))

        self.block_label = ttk.Label(status_frame, text="Block: Inactive")
        self.block_label.grid(row=4, column=0, sticky=tk.W, pady=(0, 12))

        # Control buttons with reduced padding
        control_frame = ttk.Frame(status_frame)
        control_frame.grid(row=5, column=0, sticky=(tk.W, tk.E))

        self.fixation_btn = ttk.Button(control_frame, text="Disable Fixation",
                                     command=self.toggle_fixation, state=tk.DISABLED)
        self.fixation_btn.grid(row=0, column=0, padx=2)

        self.end_btn = ttk.Button(control_frame, text="End Experiment",
                                command=self.end_experiment, state=tk.DISABLED)
        self.end_btn.grid(row=0, column=1, padx=2)

        # Screenshot frame with modern styling
        screenshot_frame = ttk.LabelFrame(content_frame, text="Headset Display", padding="8")
        screenshot_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Screenshot controls with reduced padding
        screenshot_controls = ttk.Frame(screenshot_frame)
        screenshot_controls.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 4))

        self.screenshot_btn = ttk.Button(screenshot_controls, text="Capture Screenshot",
                                       command=self.capture_screenshot, state=tk.DISABLED)
        self.screenshot_btn.grid(row=0, column=0, padx=2)

        # Screenshot display with fixed 16:9 aspect ratio (320x180)
        self.screenshot_canvas = tk.Canvas(screenshot_frame, width=320, height=180,
                                         bg='black', highlightthickness=0)
        self.screenshot_canvas.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=2, pady=2)

        # Log frame with reduced padding
        log_frame = ttk.LabelFrame(main_frame, text="System Logs", padding="8")
        log_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(8, 0))

        # Log display with dark theme
        self.log_text = tk.Text(log_frame, height=8, wrap=tk.WORD,
                              bg='#1e1e1e',
                              fg='#d4d4d4',
                              font=('Consolas', 9),
                              padx=6, pady=6,
                              insertbackground='#d4d4d4')
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Configure tag colors for different log types
        self.log_text.tag_configure('error', foreground='#f48771')  # Red for errors
        self.log_text.tag_configure('warning', foreground='#cca700')  # Yellow for warnings
        self.log_text.tag_configure('success', foreground='#6a9955')  # Green for success
        self.log_text.tag_configure('info', foreground='#569cd6')  # Blue for info

        # Scrollbar for logs with dark theme
        log_scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        log_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.log_text['yscrollcommand'] = log_scrollbar.set

        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        main_frame.rowconfigure(3, weight=1)
        content_frame.columnconfigure(1, weight=1)
        content_frame.rowconfigure(0, weight=1)
        screenshot_frame.columnconfigure(0, weight=1)
        screenshot_frame.rowconfigure(1, weight=1)
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)

    def setup_websocket_thread(self):
        def run_event_loop():
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)

            # Start the connection manager
            self.loop.create_task(self.connection_manager())

            # Run the event loop
            self.loop.run_forever()

        self.ws_thread = threading.Thread(target=run_event_loop, daemon=True)
        self.ws_thread.start()

    async def connection_manager(self):
        """Manages the WebSocket connection lifecycle"""
        while True:
            if self.should_connect and not self.connected and not self.connecting:
                self.connecting = True
                self.root.after(0, self.update_connection_state)

                try:
                    await self.connect_websocket()
                except Exception as e:
                    self.log(f"Connection error: {e}")
                    self.connected = False
                    self.connecting = False
                    self.connection_error = True
                    self.should_connect = False
                    self.root.after(0, self.update_connection_state)

            await asyncio.sleep(0.1)

    async def connect_websocket(self):
        """Establishes and maintains the WebSocket connection"""
        uri = f"ws://{self.ip_var.get()}:{self.port_var.get()}"
        self.log(f"Attempting to connect to {uri}")

        try:
            async with websockets.connect(uri) as websocket:
                self.websocket = websocket
                self.connected = True
                self.connecting = False
                self.connection_error = False
                self.root.after(0, self.update_connection_state)
                self.log("Connected to headset")

                # Start message handling
                while self.connected:
                    try:
                        message = await websocket.recv()
                        self.message_queue.put(message)
                        self.root.after(0, self.process_message, message)
                    except websockets.exceptions.ConnectionClosed:
                        self.log("Connection closed by server")
                        break
                    except Exception as e:
                        self.log(f"Error receiving message: {e}")
                        break

        except Exception as e:
            self.log(f"Connection failed: {e}")
            raise  # Re-raise to be handled by connection_manager

        finally:
            # Clean up connection state
            self.connected = False
            self.connection_error = True
            self.should_connect = False
            self.websocket = None
            self.root.after(0, self.update_connection_state)

    def process_message(self, message):
        try:
            data = json.loads(message)
            if isinstance(data, dict):
                if data.get('type') == 'status':
                    status = json.loads(data['data'])
                    self.update_status(status)
                    # Update fixation button based on status
                    if 'fixation_required' in status:
                        self.fixation_required = status['fixation_required']
                        self.update_fixation_button()
                elif data.get('type') == 'logs':
                    self.log(json.loads(data['data']))
                elif data.get('type') == 'screenshot':
                    self.update_screenshot(json.loads(data['data']))
            else:
                self.log(f"Received: {data}")
        except json.JSONDecodeError:
            self.log(f"Received: {message}")
        except Exception as e:
            self.log(f"Error processing message: {e}")

    def update_status(self, status):
        self.device_name = status.get('device_name', 'Unknown')
        self.device_model = status.get('device_model', 'Unknown')
        self.device_battery = float(status.get('device_battery', 0))
        self.current_block = status.get('active_block', 'Inactive')
        self.current_trial = int(status.get('current_trial', 0))
        self.total_trials = int(status.get('total_trials', 0))

        self.update_status_display()

    def update_status_display(self):
        self.device_name_label.config(text=f"Name: {self.device_name}")
        self.device_model_label.config(text=f"Model: {self.device_model}")
        self.device_battery_label.config(text=f"Battery: {self.device_battery:.0%}")
        self.block_label.config(text=f"Block: {self.current_block}")

        if self.total_trials > 0:
            progress = (self.current_trial / self.total_trials) * 100
            self.progress_bar['value'] = progress
            self.trial_label.config(text=f"Trial: {self.current_trial} / {self.total_trials} ({progress:.0f}%)")
        else:
            self.progress_bar['value'] = 0
            self.trial_label.config(text="Trial: 0 / 0 (0%)")

    def update_screenshot(self, screenshots):
        if not screenshots:
            self.log("No screenshot data received")
            return

        # Convert base64 to image
        try:
            image_data = base64.b64decode(screenshots[0])
            image = Image.open(io.BytesIO(image_data))

            # Get canvas dimensions
            canvas_width = self.screenshot_canvas.winfo_width()
            canvas_height = self.screenshot_canvas.winfo_height()

            if canvas_width > 1 and canvas_height > 1:  # Ensure canvas is ready
                # Calculate aspect ratio preserving dimensions
                img_ratio = image.width / image.height
                canvas_ratio = canvas_width / canvas_height

                if img_ratio > canvas_ratio:
                    # Image is wider than canvas
                    new_width = canvas_width
                    new_height = int(canvas_width / img_ratio)
                else:
                    # Image is taller than canvas
                    new_height = canvas_height
                    new_width = int(canvas_height * img_ratio)

                # Resize image while maintaining aspect ratio
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

                # Convert to PhotoImage and display
                photo = ImageTk.PhotoImage(image)

                # Clear canvas and draw black background
                self.screenshot_canvas.delete("all")
                self.screenshot_canvas.configure(bg='black')

                # Center the image on the canvas
                x = (canvas_width - new_width) // 2
                y = (canvas_height - new_height) // 2
                self.screenshot_canvas.create_image(x, y, image=photo, anchor=tk.NW)
                self.screenshot_canvas.image = photo  # Keep reference
                self.log("Screenshot displayed successfully")

        except Exception as e:
            self.log(f"Error displaying screenshot: {e}")

    def update_connection_state(self):
        if self.connected:
            self.set_connection_status("Connected", self.success_color)
            self.connect_btn.config(text="Disconnect")
            self.ip_entry.config(state=tk.DISABLED)
            self.port_entry.config(state=tk.DISABLED)
            self.screenshot_btn.config(state=tk.NORMAL)
            self.fixation_btn.config(state=tk.NORMAL)
            self.end_btn.config(state=tk.NORMAL)
            self.update_fixation_button()
        elif self.connecting:
            self.set_connection_status("Connecting...", self.warning_color)
            self.connect_btn.config(text="Cancel")
            self.ip_entry.config(state=tk.DISABLED)
            self.port_entry.config(state=tk.DISABLED)
            self.screenshot_btn.config(state=tk.DISABLED)
            self.fixation_btn.config(state=tk.DISABLED)
            self.end_btn.config(state=tk.DISABLED)
        elif self.connection_error:
            self.set_connection_status("Connection Error", self.error_color)
            self.connect_btn.config(text="Retry")
            self.ip_entry.config(state=tk.NORMAL)
            self.port_entry.config(state=tk.NORMAL)
            self.screenshot_btn.config(state=tk.DISABLED)
            self.fixation_btn.config(state=tk.DISABLED)
            self.end_btn.config(state=tk.DISABLED)
        else:
            self.set_connection_status("Disconnected", self.disabled_color)
            self.connect_btn.config(text="Connect")
            self.ip_entry.config(state=tk.NORMAL)
            self.port_entry.config(state=tk.NORMAL)
            self.screenshot_btn.config(state=tk.DISABLED)
            self.fixation_btn.config(state=tk.DISABLED)
            self.end_btn.config(state=tk.DISABLED)
            self.update_status({})

    def set_connection_status(self, status_text, color):
        self.status_label.config(text=status_text)
        self.status_canvas.itemconfig('status_dot', fill=color)

        # Update button colors based on status
        if status_text == "Connected":
            self.style.configure('TButton', background=self.success_color)
        elif status_text == "Connecting...":
            self.style.configure('TButton', background=self.warning_color)
        elif status_text == "Connection Error":
            self.style.configure('TButton', background=self.error_color)
        else:
            self.style.configure('TButton', background=self.accent_color)

    def toggle_connection(self):
        if self.connected:
            # Disconnect
            async def close_connection():
                if self.websocket:
                    await self.websocket.close()
                self.connected = False
                self.connecting = False
                self.connection_error = False
                self.should_connect = False
                self.websocket = None
                self.root.after(0, self.update_connection_state)
                self.log("Disconnected from headset")

            asyncio.run_coroutine_threadsafe(close_connection(), self.loop)
        elif self.connection_error:
            # Retry connection
            if not self.validate_ip(self.ip_var.get()):
                messagebox.showerror("Invalid Input", "Please enter a valid IP address")
                return
            if not self.validate_port(self.port_var.get()):
                messagebox.showerror("Invalid Input", "Please enter a valid port number (0-65535)")
                return

            self.connection_error = False
            self.should_connect = True
            self.update_connection_state()
        else:
            # Start new connection
            if not self.validate_ip(self.ip_var.get()):
                messagebox.showerror("Invalid Input", "Please enter a valid IP address")
                return
            if not self.validate_port(self.port_var.get()):
                messagebox.showerror("Invalid Input", "Please enter a valid port number (0-65535)")
                return

            self.should_connect = True
            self.update_connection_state()

    async def send_command(self, command):
        if self.websocket and self.connected:
            try:
                await self.websocket.send(command)
                self.log(f"Sent command: {command}")
            except Exception as e:
                self.log(f"Error sending command: {e}")
                self.connected = False
                self.connection_error = True
                self.should_connect = False
                self.root.after(0, self.update_connection_state)

    def send_command_safe(self, command):
        """Thread-safe wrapper for sending commands"""
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self.send_command(command), self.loop)
        else:
            self.log("Cannot send command: WebSocket not ready")

    def capture_screenshot(self):
        self.send_command_safe("screenshot")

    def update_fixation_button(self):
        """Update the fixation button text based on current state"""
        if self.fixation_required:
            self.fixation_btn.config(text="Disable Fixation")
        else:
            self.fixation_btn.config(text="Enable Fixation")

    def toggle_fixation(self):
        command = "disable_fixation" if self.fixation_required else "enable_fixation"
        # Update state immediately for better UI feedback
        self.fixation_required = not self.fixation_required
        self.update_fixation_button()
        self.send_command_safe(command)
        self.log(f"{'Disabled' if not self.fixation_required else 'Enabled'} fixation")

    def end_experiment(self):
        if messagebox.askyesno("Confirm", "Are you sure you want to end the experiment?"):
            self.send_command_safe("kill")

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")

        # Determine log type and apply appropriate tag
        tag = 'info'  # Default tag
        if 'error' in message.lower():
            tag = 'error'
        elif 'warning' in message.lower():
            tag = 'warning'
        elif 'connected' in message.lower() or 'success' in message.lower():
            tag = 'success'

        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n", tag)
        self.log_text.see(tk.END)

    def validate_ip(self, ip):
        pattern = r'^(\d{1,3}\.){3}\d{1,3}$|^localhost$'
        return bool(re.match(pattern, ip))

    def validate_port(self, port):
        try:
            port_num = int(port)
            return 0 <= port_num <= 65535
        except ValueError:
            return False

    def on_closing(self):
        """Clean up resources when closing the application"""
        if self.connected:
            self.toggle_connection()  # Disconnect if connected
        self.root.destroy()

def main():
    root = tk.Tk()
    app = HeadsupGUI(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)  # Handle window closing
    root.mainloop()

if __name__ == "__main__":
    main()
