const DEVICE_MAPPINGS = [
    { vid: 0x044f, pid: 0xb108, name: "Thrustmaster T.16000M", image: "images/devices/tm_t16000m.png" },
    { vid: 0x044f, pid: 0xb10a, name: "Thrustmaster T.16000M", image: "images/devices/tm_t16000m.png" },
    { vid: 0x044f, pid: 0x0402, name: "Thrustmaster Warthog", image: "images/devices/tm_warthog.png" },
    { vid: 0x044f, pid: 0x0404, name: "Thrustmaster Warthog", image: "images/devices/tm_warthog.png" },
    { vid: 0x044f, pid: 0xb68f, name: "Thrustmaster TPR", image: "images/devices/thrustmaster-t-pendular-pedals.png" },
    { vid: 0x06a3, pid: 0x0d05, name: "Logitech Radio Panel", image: "images/devices/radio_panel.png" },
    { vid: 0x06a3, pid: 0x0d06, name: "Logitech Multi Panel", image: "images/devices/logitech_multi_panel.png" },
    { vid: 0x06a3, pid: 0x0d67, name: "Logitech Switch Panel", image: "images/devices/logitech_switch_panel.png" },
    { vid: 0x06a3, pid: 0x0763, name: "Logitech Rudder Pedals", image: "images/devices/logitech-ruddder-pedals.png" },
    { vid: 0x294b, pid: 0x1900, name: "Honeycomb Alpha", image: "images/devices/hc_alpha.png" },
    { vid: 0x294b, pid: 0x1901, name: "Honeycomb Bravo", image: "images/devices/hc_bravo.png" },
    { vid: 0x0b0e, pid: 0x0420, name: "Jabra Speak 510", image: "images/devices/jabra-speak-510.png" },
    { vid: 0x1dd2, pid: 0x2201, name: "Leo Bodnar BU0836X", image: "images/devices/bodnar_bu0386x.png" },
    { vid: 0x1dd2, pid: 0x2040, name: "Leo Bodnar BU0836", image: "images/devices/bodnar_bu0386.png" },
    { vid: 0x2e8a, pid: 0x0003, name: "RPi Pico (Bootloader)", image: "images/devices/rpi-pico.png" },
    { vid: 0x2e8a, pid: 0x000a, name: "GP2040-CE", image: "images/devices/rpi-pico.png" },
    { vid: 0x046d, pid: 0xb023, name: "Logitech MX Master 3S", image: "images/devices/logitech_mxmaster3s.png" },
    { vid: 0x046d, pid: 0xc548, name: "Logitech MX Master 3S", image: "images/devices/logitech_mxmaster3s.png" },
];

const FALLBACK_IMAGE = "images/devices/yoke.png";

const btnConnect = document.getElementById('btnConnect');
const deviceGrid = document.getElementById('deviceGrid');
const unsupported = document.getElementById('unsupported');

if (!navigator.usb && !navigator.getGamepads) {
    unsupported.style.display = 'block';
    btnConnect.disabled = true;
}

// Track axis activity to hide non-existent ones
let axisActivity = new Map(); // Key: gamepad-index-axisIndex, Value: boolean (hasMoved)

function updateDeviceList() {
    let usbDevices = [];
    if (navigator.usb) {
        navigator.usb.getDevices().then(devices => {
            let gamepads = [];
            if (navigator.getGamepads) {
                gamepads = Array.from(navigator.getGamepads()).filter(g => g !== null);
            }
            renderDevices(devices, gamepads);
        });
    } else {
        let gamepads = [];
        if (navigator.getGamepads) {
            gamepads = Array.from(navigator.getGamepads()).filter(g => g !== null);
        }
        renderDevices([], gamepads);
    }
}

function findMapping(vid, pid, name, vendorName) {
    // 1. Precise VID/PID match
    const precise = DEVICE_MAPPINGS.find(m => m.vid === vid && m.pid === pid);
    if (precise) return precise;

    const n = (name || "").toLowerCase();
    const vn = (vendorName || "").toLowerCase();

    // 2. Vendor ID fallback (Jabra)
    if (vid === 0x0b0e) {
        return { name: name || "Jabra Device", image: "images/devices/jabra-speak-510.png" };
    }

    // 3. Name based fallbacks
    if (n.includes("jabra") || vn.includes("jabra")) {
        return { name: name || "Jabra Device", image: "images/devices/jabra-speak-510.png" };
    }
    if (n.includes("bodnar") || vn.includes("bodnar")) {
        if (n.includes("bu0836x")) return { name: "Leo Bodnar BU0836X", image: "images/devices/bodnar_bu0386x.png" };
        return { name: "Leo Bodnar BU0836", image: "images/devices/bodnar_bu0386.png" };
    }
    if (n.includes("t.16000m")) return { name: "Thrustmaster T.16000M", image: "images/devices/tm_t16000m.png" };
    if (n.includes("warthog")) return { name: "Thrustmaster Warthog", image: "images/devices/tm_warthog.png" };

    return null;
}

function parseGamepadId(id) {
    const vidMatch = id.match(/vendor: ([0-9a-f]{4})/i);
    const pidMatch = id.match(/product: ([0-9a-f]{4})/i);
    return {
        vid: vidMatch ? parseInt(vidMatch[1], 16) : 0,
        pid: pidMatch ? parseInt(pidMatch[1], 16) : 0
    };
}

function getAxisName(idx) {
    if (idx === 0) return 'Roll';
    if (idx === 1) return 'Pitch';
    if (idx === 3) return 'Throttle';
    if (idx === 2) return 'Z-Axis';
    if (idx === 4) return 'Hat-X';
    if (idx === 5) return 'Hat-Y';
    return `Axis ${idx}`;
}

function renderDevices(usbDevices, gamepads) {
    deviceGrid.innerHTML = '';
    
    // Improved deduplication: track by VID/PID to avoid showing the same physical device twice
    const seenUsbKeys = new Set();

    gamepads.forEach((gp) => {
        const { vid, pid } = parseGamepadId(gp.id);
        const key = `gp-${vid}-${pid}`;
        seenUsbKeys.add(`${vid}-${pid}`); // Mark this hardware as seen
        
        const nameFromId = gp.id.split('(')[0].trim();
        const mapping = findMapping(vid, pid, nameFromId, "");
        const name = mapping ? mapping.name : nameFromId;
        const image = mapping ? `../${mapping.image}` : `../${FALLBACK_IMAGE}`;

        const card = createDeviceCard(`gp-${gp.index}`, name, image, vid, pid, gp);
        deviceGrid.appendChild(card);
    });

    usbDevices.forEach(device => {
        const key = `${device.vendorId}-${device.productId}`;
        // If we already saw this hardware as a gamepad, skip the "dumb" USB entry
        if (seenUsbKeys.has(key)) return;

        const mapping = findMapping(device.vendorId, device.productId, device.productName, device.manufacturerName);
        const name = mapping ? mapping.name : (device.productName || "Unknown USB Device");
        const image = mapping ? `../${mapping.image}` : `../${FALLBACK_IMAGE}`;

        const card = createDeviceCard(`usb-${device.vendorId}-${device.productId}`, name, image, device.vendorId, device.productId, null);
        deviceGrid.appendChild(card);
    });

    if (deviceGrid.children.length === 0) {
        deviceGrid.innerHTML = `
            <div class="empty-state">
                <p>No devices detected. Click "Scan for Joysticks" or move a joystick button to wake it up.</p>
            </div>`;
    }
}

function createDeviceCard(id, name, image, vid, pid, gamepad) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.id = id;
    
    let inputHtml = '';
    if (gamepad) {
        inputHtml = `
            <div class="device-inputs" id="inputs-${gamepad.index}" style="width: 100%;">
                <div class="axes-container" id="axes-container-${gamepad.index}">
                    ${gamepad.axes.map((val, i) => {
                        const axisKey = `${gamepad.index}-${i}`;
                        const isVisible = axisActivity.get(axisKey) || false;
                        return `
                            <div class="axis-group" id="axis-group-${gamepad.index}-${i}" style="display: ${isVisible ? 'flex' : 'none'}">
                                <div class="axis-name">${getAxisName(i)}</div>
                                <div class="axis-bar-v">
                                    <div class="axis-fill-v" id="axis-fill-${gamepad.index}-${i}" style="height: 50%"></div>
                                </div>
                                <div class="axis-value" id="axis-val-${gamepad.index}-${i}">${val.toFixed(2)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="buttons-container">
                    ${gamepad.buttons.map((_, i) => `
                        <div class="button-node" id="btn-${gamepad.index}-${i}">${i + 1}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <img src="${image}" class="device-image" alt="${name}" onerror="this.src='../images/devices/panel_generic.png'">
        <div class="device-name">${name}</div>
        <div class="device-info">
            VID: <span class="badge">0x${vid.toString(16).padStart(4, '0')}</span> 
            PID: <span class="badge">0x${pid.toString(16).padStart(4, '0')}</span>
        </div>
        ${inputHtml}
    `;
    return card;
}

function updateGamepadValues() {
    if (!navigator.getGamepads) return;
    
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (!gp) continue;

        // Update axes
        gp.axes.forEach((val, axisIdx) => {
            const axisKey = `${gp.index}-${axisIdx}`;
            
            // Detection: if value is non-zero or has moved, mark as active
            if (!axisActivity.has(axisKey) && Math.abs(val) > 0.05) {
                axisActivity.set(axisKey, true);
                const groupEl = document.getElementById(`axis-group-${gp.index}-${axisIdx}`);
                if (groupEl) groupEl.style.display = 'flex';
            }

            const fillEl = document.getElementById(`axis-fill-${gp.index}-${axisIdx}`);
            const valEl = document.getElementById(`axis-val-${gp.index}-${axisIdx}`);
            
            if (fillEl) {
                const percentage = ((val + 1) / 2) * 100;
                fillEl.style.height = `${percentage}%`;
            }
            if (valEl) {
                valEl.innerText = val.toFixed(3);
                valEl.style.color = Math.abs(val) > 0.01 ? '#fff' : 'var(--text-dim)';
            }
        });

        // Update buttons
        gp.buttons.forEach((btn, btnIdx) => {
            const el = document.getElementById(`btn-${gp.index}-${btnIdx}`);
            if (el) {
                if (btn.pressed) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        });
    }
    
    requestAnimationFrame(updateGamepadValues);
}

btnConnect.addEventListener('click', async () => {
    try {
        if (navigator.usb) {
            await navigator.usb.requestDevice({ filters: [] });
        }
        updateDeviceList();
    } catch (err) {
        console.error('Selection failed:', err);
    }
});

updateDeviceList();

window.addEventListener("gamepadconnected", (e) => {
    updateDeviceList();
});

window.addEventListener("gamepaddisconnected", (e) => {
    updateDeviceList();
});

if (navigator.usb) {
    navigator.usb.addEventListener('connect', () => updateDeviceList());
    navigator.usb.addEventListener('disconnect', () => updateDeviceList());
}

updateGamepadValues();
