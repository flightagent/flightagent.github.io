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

if (!navigator.usb) {
    unsupported.style.display = 'block';
    btnConnect.disabled = true;
}

async function updateDeviceList() {
    const devices = await navigator.usb.getDevices();
    renderDevices(devices);
}

function findMapping(vid, pid) {
    return DEVICE_MAPPINGS.find(m => m.vid === vid && m.pid === pid);
}

function renderDevices(devices) {
    if (devices.length === 0) {
        deviceGrid.innerHTML = `
            <div class="empty-state">
                <p>No devices authorized. Click the button above to authorize a device.</p>
            </div>`;
        return;
    }

    deviceGrid.innerHTML = '';
    devices.forEach(device => {
        const mapping = findMapping(device.vendorId, device.productId);
        const name = mapping ? mapping.name : (device.productName || "Unknown Device");
        // We use relative paths from the usb-tester directory, so we need to go up one level to reach images/
        const image = mapping ? `../${mapping.image}` : `../${FALLBACK_IMAGE}`;

        const card = document.createElement('div');
        card.className = 'device-card';
        card.innerHTML = `
            <img src="${image}" class="device-image" alt="${name}" onerror="this.src='../images/devices/panel_generic.png'">
            <div class="device-name">${name}</div>
            <div class="device-info">
                VID: <span class="badge">0x${device.vendorId.toString(16).padStart(4, '0')}</span> 
                PID: <span class="badge">0x${device.productId.toString(16).padStart(4, '0')}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--accent);">
                ${device.manufacturerName || ''}
            </div>
        `;
        deviceGrid.appendChild(card);
    });
}

btnConnect.addEventListener('click', async () => {
    try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        console.log('Device selected:', device);
        updateDeviceList();
    } catch (err) {
        console.error('Selection failed:', err);
    }
});

// Initial load
updateDeviceList();

// Listen for connection events
navigator.usb.addEventListener('connect', (event) => {
    console.log('Device connected:', event.device);
    updateDeviceList();
});

navigator.usb.addEventListener('disconnect', (event) => {
    console.log('Device disconnected:', event.device);
    updateDeviceList();
});
