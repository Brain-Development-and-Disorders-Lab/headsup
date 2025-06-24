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
import os
import subprocess

class HeadsupGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Headsup: Control Panel")
        self.root.geometry("700x600")
        self.root.resizable(False, False)

        # Set window icon
        icon_path = os.path.join(os.path.dirname(__file__), "Headsup_Icon.png")
        if os.path.exists(icon_path):
            icon_image = Image.open(icon_path)
            icon_photo = ImageTk.PhotoImage(icon_image)
            self.root.iconphoto(True, icon_photo)
            self.root.icon_image = icon_photo  # Keep a reference to prevent garbage collection
        else:
            print(f"Warning: Icon file not found at {icon_path}")

        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')

        # Configure colors for light theme
        self.bg_color = '#f5f5f5'
        self.fg_color = '#333333'
        self.accent_color = '#007acc'
        self.success_color = '#28a745'
        self.warning_color = '#ffc107'
        self.error_color = '#dc3545'
        self.disabled_color = '#cccccc'

        # Configure styles
        self.style.configure('TFrame', background=self.bg_color)
        self.style.configure('TLabel', background=self.bg_color, foreground=self.fg_color, font=('Helvetica', 10))
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
                           foreground='#666666')
        self.style.configure('Status.TLabel',
                           font=('Helvetica', 10, 'bold'))
        self.style.configure('Bold.TLabel', background=self.bg_color, foreground=self.fg_color, font=('Helvetica', 10, 'bold'))

        # Configure the root window
        self.root.configure(bg=self.bg_color)

        # WebSocket state
        self.websocket = None
        self.connected = False
        self.connecting = False
        self.connection_error = False
        self.message_queue = queue.Queue()
        self.ws_thread = None
        self.should_connect = False
        self.loop = None

        # ADB Configuration
        self.package_name = "com.BrainDevelopmentandDisordersLab.task_vr_rdk"
        self.adb_port = "5555" # Default ADB port
        self.application_launched = False

        # Headset state
        self.device_name = "Offline"
        self.device_model = "Offline"
        self.device_battery = 0.0
        self.current_block = "Inactive"
        self.current_trial = 0
        self.total_trials = 0
        self.fixation_required = True
        self.screenshot_data = []

        # Task and calibration state
        self.task_started = False
        self.calibration_started = False

        self.setup_gui()
        self.setup_websocket_thread()

    def setup_gui(self):
        # Create main container with reduced padding
        main_frame = ttk.Frame(self.root, padding="12")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Connection frame with reduced padding
        conn_frame = ttk.LabelFrame(main_frame, text="Connectivity Status", padding="10")
        conn_frame.grid(row=0, column=0, columnspan=7, sticky=(tk.W, tk.E), pady=(0, 12))

        # Connection controls with reduced padding
        adb_controls_frame = ttk.Frame(conn_frame)
        adb_controls_frame.grid(row=0, column=0, columnspan=7, sticky=(tk.W, tk.E), pady=(0, 4))

        # IP Address with reduced padding
        ttk.Label(adb_controls_frame, text="Headset IP Address:").grid(row=0, column=0, padx=(0, 4))
        self.ip_var = tk.StringVar(value="localhost")
        self.ip_entry = ttk.Entry(adb_controls_frame, textvariable=self.ip_var, width=20)
        self.ip_entry.grid(row=0, column=1, padx=(0, 12))

        # Launch button
        self.launch_btn = ttk.Button(adb_controls_frame, text="Launch Application", command=self.launch_application)
        self.launch_btn.grid(row=0, column=2, padx=2)

        # Quit button
        self.quit_btn = ttk.Button(adb_controls_frame, text="Quit Application", command=self.quit_application, state=tk.DISABLED)
        self.quit_btn.grid(row=0, column=3, padx=2)

        ws_controls_frame = ttk.Frame(conn_frame)
        ws_controls_frame.grid(row=1, column=0, columnspan=7, sticky=(tk.W, tk.E))

        # Port with reduced padding
        ttk.Label(ws_controls_frame, text="Server Port:").grid(row=0, column=0, padx=(0, 4))
        self.port_var = tk.StringVar(value="4444")
        self.port_entry = ttk.Entry(ws_controls_frame, textvariable=self.port_var, width=6, state=tk.DISABLED)
        self.port_entry.grid(row=0, column=1, padx=(0, 12))

        # Connect button
        self.connect_btn = ttk.Button(ws_controls_frame, text="Connect", command=self.toggle_connection, state=tk.DISABLED)
        self.connect_btn.grid(row=0, column=2, padx=4)

        # Status indicator
        self.status_canvas = tk.Canvas(ws_controls_frame, width=14, height=14,
                                     bg=self.bg_color, highlightthickness=0)
        self.status_canvas.grid(row=0, column=3, padx=(12, 6))
        self.status_canvas.create_oval(2, 2, 12, 12, fill=self.disabled_color, tags='status_dot')

        self.status_label = ttk.Label(ws_controls_frame, text="Disconnected", style='Status.TLabel')
        self.status_label.grid(row=0, column=4, sticky=tk.W)

        # Status and Screenshot container
        content_frame = ttk.Frame(main_frame)
        content_frame.grid(row=1, column=0, columnspan=7, sticky=(tk.W, tk.E, tk.N, tk.S))
        content_frame.columnconfigure(1, weight=1)
        content_frame.rowconfigure(0, weight=1)

        # Status frame with reduced padding
        status_frame = ttk.LabelFrame(content_frame, text="Device Status", padding="12")
        status_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 8))

        # Device info with increased padding
        info_frame = ttk.Frame(status_frame)
        info_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 16))
        info_frame.columnconfigure(1, weight=1)  # Make value column expand

        # Name label and value
        name_label = ttk.Label(info_frame, text="Name:", style='Bold.TLabel')
        name_label.grid(row=0, column=0, sticky=tk.W, pady=4, padx=(0, 8))
        self.device_name_label = ttk.Label(info_frame, text="Offline")
        self.device_name_label.grid(row=0, column=1, sticky=tk.W, pady=4)

        # Model label and value
        model_label = ttk.Label(info_frame, text="Model:", style='Bold.TLabel')
        model_label.grid(row=1, column=0, sticky=tk.W, pady=4, padx=(0, 8))
        self.device_model_label = ttk.Label(info_frame, text="Offline")
        self.device_model_label.grid(row=1, column=1, sticky=tk.W, pady=4)

        # Battery label and value
        battery_label = ttk.Label(info_frame, text="Battery:", style='Bold.TLabel')
        battery_label.grid(row=2, column=0, sticky=tk.W, pady=4, padx=(0, 8))
        self.device_battery_label = ttk.Label(info_frame, text="Offline")
        self.device_battery_label.grid(row=2, column=1, sticky=tk.W, pady=4)

        # Experiment progress with increased padding
        ttk.Label(status_frame, text="Experiment Progress", style='Bold.TLabel').grid(row=1, column=0, sticky=tk.W, pady=(8, 8))
        self.progress_bar = ttk.Progressbar(status_frame, length=200, mode='determinate', style='TProgressbar')
        self.progress_bar.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 8))

        self.trial_label = ttk.Label(status_frame, text="Trial: 0 / 0 (0%)")
        self.trial_label.grid(row=3, column=0, sticky=tk.W, pady=(0, 8))

        self.block_label = ttk.Label(status_frame, text="Block: Inactive")
        self.block_label.grid(row=4, column=0, sticky=tk.W, pady=(0, 16))

        # Task and Calibration buttons
        task_cal_frame = ttk.Frame(status_frame)
        task_cal_frame.grid(row=5, column=0, sticky=(tk.W, tk.E), pady=(0, 8))
        task_cal_frame.columnconfigure(0, weight=1)
        task_cal_frame.columnconfigure(1, weight=1)

        self.start_task_btn = ttk.Button(task_cal_frame, text="Start Task",
                                       command=self.start_task, state=tk.DISABLED)
        self.start_task_btn.grid(row=0, column=0, padx=4, sticky=tk.E)

        self.start_calibration_btn = ttk.Button(task_cal_frame, text="Start Calibration",
                                              command=self.start_calibration, state=tk.DISABLED)
        self.start_calibration_btn.grid(row=0, column=1, padx=4, sticky=tk.W)

        # Control buttons with increased padding
        control_frame = ttk.Frame(status_frame)
        control_frame.grid(row=6, column=0, sticky=(tk.W, tk.E), pady=(0, 8))
        control_frame.columnconfigure(0, weight=1)
        control_frame.columnconfigure(1, weight=1)

        self.fixation_btn = ttk.Button(control_frame, text="Disable Fixation",
                                     command=self.toggle_fixation, state=tk.DISABLED)
        self.fixation_btn.grid(row=0, column=0, padx=4, sticky=tk.E)

        self.end_btn = ttk.Button(control_frame, text="End Experiment",
                                command=self.end_experiment, state=tk.DISABLED)
        self.end_btn.grid(row=0, column=1, padx=4, sticky=tk.W)

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
        self.screenshot_canvas.grid(row=1, column=0, sticky=(tk.W, tk.N), padx=2, pady=2)

        # Log frame with reduced padding
        log_frame = ttk.LabelFrame(main_frame, text="System Logs", padding="8")
        log_frame.grid(row=2, column=0, columnspan=7, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(8, 0))

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
        main_frame.columnconfigure(6, weight=1)
        main_frame.rowconfigure(2, weight=1)
        content_frame.columnconfigure(1, weight=1)
        content_frame.rowconfigure(0, weight=1)
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
        self.device_name_label.config(text=self.device_name)
        self.device_model_label.config(text=self.device_model)
        self.device_battery_label.config(text=f"{self.device_battery:.0%}")
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
        # Check if we're connecting to localhost (development mode)
        is_localhost = self.ip_var.get().lower() == "localhost"

        if self.connected:
            self.set_connection_status("Connected", self.success_color)
            self.connect_btn.config(text="Disconnect", state=tk.NORMAL)
            self.ip_entry.config(state=tk.DISABLED)
            self.port_entry.config(state=tk.DISABLED)
            self.launch_btn.config(state=tk.DISABLED)
            self.quit_btn.config(state=tk.NORMAL if self.application_launched else tk.DISABLED)
            self.screenshot_btn.config(state=tk.NORMAL)
            self.fixation_btn.config(state=tk.NORMAL)
            self.end_btn.config(state=tk.NORMAL)
            self.start_task_btn.config(state=tk.NORMAL)
            self.start_calibration_btn.config(state=tk.NORMAL if self.task_started else tk.DISABLED)
            self.update_fixation_button()

            # Clear console, screenshot, and reset device status on new connection
            self.clear_console()
            self.clear_screenshot()
            self.reset_device_status()

        elif self.connecting:
            self.set_connection_status("Connecting...", self.warning_color)
            self.connect_btn.config(text="Cancel", state=tk.NORMAL)
            self.ip_entry.config(state=tk.DISABLED)
            self.port_entry.config(state=tk.DISABLED)
            self.launch_btn.config(state=tk.DISABLED)
            self.quit_btn.config(state=tk.DISABLED)
            self.screenshot_btn.config(state=tk.DISABLED)
            self.fixation_btn.config(state=tk.DISABLED)
            self.end_btn.config(state=tk.DISABLED)
            self.start_task_btn.config(state=tk.DISABLED)
            self.start_calibration_btn.config(state=tk.DISABLED)
        elif self.connection_error:
            self.set_connection_status("Connection Error", self.error_color)
            self.connect_btn.config(text="Retry", state=tk.NORMAL)
            self.ip_entry.config(state=tk.NORMAL)
            self.port_entry.config(state=tk.NORMAL)
            self.launch_btn.config(state=tk.NORMAL)
            self.quit_btn.config(state=tk.NORMAL if self.application_launched else tk.DISABLED)
            self.screenshot_btn.config(state=tk.DISABLED)
            self.fixation_btn.config(state=tk.DISABLED)
            self.end_btn.config(state=tk.DISABLED)
            self.start_task_btn.config(state=tk.DISABLED)
            self.start_calibration_btn.config(state=tk.DISABLED)
        else:
            self.set_connection_status("Disconnected", self.disabled_color)
            self.launch_btn.config(state=tk.NORMAL)
            self.ip_entry.config(state=tk.NORMAL)
            self.quit_btn.config(state=tk.NORMAL if self.application_launched else tk.DISABLED)

            # Allow connection if app is launched OR if connecting to localhost (development mode)
            connect_state = tk.NORMAL if (self.application_launched or is_localhost) else tk.DISABLED
            self.connect_btn.config(text="Connect", state=connect_state)
            self.port_entry.config(state=connect_state)

            self.screenshot_btn.config(state=tk.DISABLED)
            self.fixation_btn.config(state=tk.DISABLED)
            self.end_btn.config(state=tk.DISABLED)
            self.start_task_btn.config(state=tk.DISABLED)
            self.start_calibration_btn.config(state=tk.DISABLED)
            self.update_status({})

    def set_connection_status(self, status_text, color):
        self.status_label.config(text=status_text)
        self.status_canvas.itemconfig('status_dot', fill=color)

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

    def launch_application(self):
        """Launch the application on the device using ADB"""
        try:
            # Get the IP address from the entry field
            device_ip = self.ip_var.get()

            # Check if IP is valid
            if not self.validate_ip(device_ip):
                messagebox.showerror("Invalid Input", "Please enter a valid IP address")
                return

            # Special handling for localhost (development mode)
            if device_ip.lower() == "localhost":
                self.log("Development mode: Skipping ADB launch for localhost")
                self.application_launched = True
                self.quit_btn.config(state=tk.NORMAL)
                self.ip_entry.config(state=tk.NORMAL)
                self.port_entry.config(state=tk.NORMAL)
                self.connect_btn.config(state=tk.NORMAL)
                self.update_connection_state()
                return

            # Connect to device via ADB
            connect_cmd = ["adb", "connect", f"{device_ip}:{self.adb_port}"]
            self.log(f"Connecting to device: {' '.join(connect_cmd)}")

            result = subprocess.run(connect_cmd, capture_output=True, text=True, timeout=10)

            if result.returncode != 0:
                self.log(f"ADB connect failed: {result.stderr}")
                messagebox.showerror("ADB Error", f"Failed to connect to device: {result.stderr}")
                return

            self.log(f"ADB connect result: {result.stdout.strip()}")

            # Launch the application
            launch_cmd = ["adb", "-s", f"{device_ip}:{self.adb_port}", "shell", "am", "start", "-n", f"{self.package_name}/com.unity3d.player.UnityPlayerActivity"]
            self.log(f"Launching application: {' '.join(launch_cmd)}")

            result = subprocess.run(launch_cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                self.log("Application launched successfully")
                messagebox.showinfo("Success", "Application launched successfully on the device")
                self.application_launched = True
                self.quit_btn.config(state=tk.NORMAL)
                self.ip_entry.config(state=tk.NORMAL)
                self.port_entry.config(state=tk.NORMAL)
                self.connect_btn.config(state=tk.NORMAL)
            else:
                self.log(f"Launch failed: {result.stderr}")
                messagebox.showerror("Launch Error", f"Failed to launch application: {result.stderr}")

        except subprocess.TimeoutExpired:
            self.log("ADB command timed out")
            messagebox.showerror("Timeout", "ADB command timed out. Please check device connection.")
        except FileNotFoundError:
            self.log("ADB not found in PATH")
            messagebox.showerror("ADB Error", "ADB not found. Please ensure Android SDK is installed and ADB is in your PATH.")
        except Exception as e:
            self.log(f"Launch error: {e}")
            messagebox.showerror("Error", f"Unexpected error: {e}")

    def quit_application(self):
        """Quit the application on the device using ADB"""
        if messagebox.askyesno("Confirm Quit", "Are you sure you want to quit the application? If an experiment is running, all data will be lost."):
            try:
                device_ip = self.ip_var.get()

                if not self.validate_ip(device_ip):
                    messagebox.showerror("Invalid Input", "Please enter a valid IP address")
                    return

                # Special handling for localhost (development mode)
                if device_ip.lower() == "localhost":
                    self.log("Development mode: Skipping ADB quit for localhost")
                    self.application_launched = False
                    self.quit_btn.config(state=tk.DISABLED)
                    self.ip_entry.config(state=tk.DISABLED)
                    self.port_entry.config(state=tk.DISABLED)
                    self.connect_btn.config(state=tk.DISABLED)
                    self.update_connection_state()
                    return

                # ADB command to force stop
                quit_cmd = ["adb", "-s", f"{device_ip}:{self.adb_port}", "shell", "am", "force-stop", self.package_name]
                self.log(f"Quitting application: {' '.join(quit_cmd)}")

                result = subprocess.run(quit_cmd, capture_output=True, text=True, timeout=10)

                if result.returncode == 0:
                    self.log("Application quit successfully")
                    self.application_launched = False
                    self.quit_btn.config(state=tk.DISABLED)
                    self.ip_entry.config(state=tk.DISABLED)
                    self.port_entry.config(state=tk.DISABLED)
                    self.connect_btn.config(state=tk.DISABLED)
                else:
                    self.log(f"Quit failed: {result.stderr}")
                    messagebox.showerror("Quit Error", f"Failed to quit application: {result.stderr}")

            except subprocess.TimeoutExpired:
                self.log("ADB command timed out")
                messagebox.showerror("Timeout", "ADB command timed out. Please check device connection.")
            except FileNotFoundError:
                self.log("ADB not found in PATH")
                messagebox.showerror("ADB Error", "ADB not found. Please ensure Android SDK is installed and ADB is in your PATH.")
            except Exception as e:
                self.log(f"Quit error: {e}")
                messagebox.showerror("Error", f"Unexpected error: {e}")

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

    def start_task(self):
        """Start the task on the headset"""
        self.task_started = True
        self.start_task_btn.config(state=tk.DISABLED)
        self.start_calibration_btn.config(state=tk.NORMAL)
        self.send_command_safe("start_task")
        self.log("Task started")

    def start_calibration(self):
        """Start the calibration on the headset"""
        self.calibration_started = True
        self.start_calibration_btn.config(state=tk.DISABLED)
        self.send_command_safe("start_calibration")
        self.log("Calibration started")

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

    def clear_console(self):
        """Clear the console log"""
        self.log_text.delete(1.0, tk.END)

    def clear_screenshot(self):
        """Clear the screenshot display"""
        self.screenshot_canvas.delete("all")
        self.screenshot_canvas.configure(bg='black')

    def reset_device_status(self):
        """Reset device status information to default values"""
        self.device_name = "Offline"
        self.device_model = "Offline"
        self.device_battery = 0.0
        self.current_block = "Inactive"
        self.current_trial = 0
        self.total_trials = 0
        self.fixation_required = True
        self.task_started = False
        self.calibration_started = False
        self.update_status_display()

def main():
    root = tk.Tk()
    app = HeadsupGUI(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)  # Handle window closing
    root.mainloop()

if __name__ == "__main__":
    main()
