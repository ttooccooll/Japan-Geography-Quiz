var map = L.map("map", {
  zoomControl: false,
});

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
  {
    subdomains: "abcd",
    maxZoom: 30,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
).addTo(map);

var japanBounds = [
  [24.0, 122.0],
  [46.5, 146.0],
];
map.fitBounds(japanBounds);

let locations = [
  // --- Major Cities ---
  {
    name: "Tokyo",
    lat: 35.6895,
    lng: 139.6917,
    type: "City",
  },
  {
    name: "Osaka",
    lat: 34.6937,
    lng: 135.5023,
    type: "City",
  },
  {
    name: "Kyoto",
    lat: 35.0116,
    lng: 135.7681,
    type: "City",
  },
  {
    name: "Yokohama",
    lat: 35.4437,
    lng: 139.638,
    type: "City",
  },
  {
    name: "Nagoya",
    lat: 35.1815,
    lng: 136.9066,
    type: "City",
  },
  {
    name: "Sapporo",
    lat: 43.0618,
    lng: 141.3545,
    type: "City",
  },
  {
    name: "Fukuoka",
    lat: 33.5904,
    lng: 130.4017,
    type: "City",
  },
  {
    name: "Hiroshima",
    lat: 34.3853,
    lng: 132.4553,
    type: "City",
  },
  {
    name: "Sendai",
    lat: 38.2682,
    lng: 140.8694,
    type: "City",
  },
  {
    name: "Nagasaki",
    lat: 32.7503,
    lng: 129.8777,
    type: "City",
  },

  // --- Major Islands ---
  {
    name: "Honshu",
    lat: 36.2048,
    lng: 138.2529,
    type: "Island",
  },
  {
    name: "Hokkaido",
    lat: 43.2203,
    lng: 142.8635,
    type: "Island",
  },
  {
    name: "Kyushu",
    lat: 32.7503,
    lng: 129.8777,
    type: "Island",
  },
  {
    name: "Shikoku",
    lat: 33.7832,
    lng: 133.5311,
    type: "Island",
  },
  {
    name: "Okinawa",
    lat: 26.3344,
    lng: 127.8056,
    type: "Island",
  },
];

locations
  .filter((l) => l.type === "City")
  .forEach((city) => {
    L.circleMarker([city.lat, city.lng], {
      radius: 1,
      color: "#ff0000",
      fillColor: "#ffffff",
      fillOpacity: 0.3,
      opacity: 0.8,
      interactive: false,
    }).addTo(map);
  });

let score = 0;
let streak = 0;
let mistakes = 0;
let totalClicks = 0;

let remainingCountries = [...locations];

let currentCountry = null;
const tolerancePerCountry = {
  Tokyo: 0.2,
  Osaka: 0.2,
  Kyoto: 0.2,
  Yokohama: 0.2,
  Nagoya: 0.2,
  Sapporo: 0.2,
  Fukuoka: 0.2,
  Hiroshima: 0.2,
  Sendai: 0.2,
  Nagasaki: 0.2,
  Honshu: 4,
  Hokkaido: 3,
  Kyushu: 2.5,
  Shikoku: 2,
};

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const infoEl = document.getElementById("info");

function typeIcon(type) {
  return (
    {
      City: "🏙️",
      Island: "🏝️",
    }[type] || "📍"
  );
}

function pickCountry() {
  if (remainingCountries.length === 0) {
    showEndScreen();
    return;
  }

  const index = Math.floor(Math.random() * remainingCountries.length);
  currentCountry = remainingCountries[index];

  infoEl.innerHTML = `${typeIcon(currentCountry.type)} Where is the <b>${currentCountry.type}</b> of <b>${currentCountry.name}</b>?`;

  mistakes = 0;

  if (messageEl.textContent === "Nope. Try again.") {
    messageEl.textContent = "Good job!";
  }
}

map.on("click", function (e) {
  totalClicks++;
  const tolerance = tolerancePerCountry[currentCountry.name] || 1;
  const dist = Math.sqrt(
    Math.pow(e.latlng.lat - currentCountry.lat, 2) +
      Math.pow(e.latlng.lng - currentCountry.lng, 2),
  );

  if (dist < tolerance) {
    L.circle([e.latlng.lat, e.latlng.lng], {
      radius: 20000,
      color: "green",
    })
      .addTo(map)
      .bindPopup(`✅ Correct! ${currentCountry.name}`)
      .openPopup();

    score++;
    streak++;
    scoreEl.textContent = `Score: ${score} | Streak: ${streak}`;

    remainingCountries = remainingCountries.filter(
      (c) => c.name !== currentCountry.name,
    );

    pickCountry();
  } else {
    mistakes++;

    score = Math.max(0, score - 1);
    streak = 0;
    scoreEl.textContent = `Score: ${score} | Streak: ${streak}`;
    messageEl.textContent = `Nope. Try again.`;

    const wrongCircle = L.circle([e.latlng.lat, e.latlng.lng], {
      radius: 20000,
      color: "red",
      fillColor: "red",
      fillOpacity: 0.6,
      opacity: 1,
    }).addTo(map);

    setTimeout(() => {
      let opacity = 1;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          map.removeLayer(wrongCircle);
        } else {
          wrongCircle.setStyle({
            opacity: opacity,
            fillOpacity: opacity * 0.6,
          });
        }
      }, 50);
    }, 5000);

    if (mistakes >= 3) {
      hintPulse(currentCountry.lat, currentCountry.lng);
    }
  }
});

function resetGame() {
  score = 0;
  streak = 0;
  mistakes = 0;
  totalClicks = 0;
  currentCountry = null;

  remainingCountries = [...locations];

  scoreEl.textContent = "Score: 0 | Streak: 0";
  messageEl.textContent = "Welcome!";

  document.getElementById("endScreen").classList.add("hidden");
  document.getElementById("paymentQR").classList.add("hidden");

  map.eachLayer((layer) => {
    if (layer instanceof L.Circle || layer instanceof L.Popup) {
      map.removeLayer(layer);
    }
  });

  pickCountry();
}

function hintPulse(lat, lng) {
  const pulse = L.circle([lat, lng], {
    radius: 100000,
    color: "#00bcd4",
    weight: 1,
    fillOpacity: 0,
    opacity: 0.2,
  }).addTo(map);

  let radius = 100000;
  let opacity = 0.8;

  const pulseInterval = setInterval(() => {
    radius += 25000;
    opacity -= 0.05;

    if (opacity <= 0) {
      clearInterval(pulseInterval);
      map.removeLayer(pulse);
    } else {
      pulse.setStyle({ opacity });
      pulse.setRadius(radius);
    }
  }, 60);
}

document.addEventListener("DOMContentLoaded", () => {
  const scoreEl = document.getElementById("score");
  const messageEl = document.getElementById("message");
  const infoEl = document.getElementById("info");

  window.showLightningModal();

  resetGame();

  document.getElementById("restartBtn").addEventListener("click", () => {
    resetGame();
  });
});

const faqBtn = document.getElementById("faqBtn");
const paymentsBtn = document.getElementById("paymentsBtn");

const faqPopup = document.getElementById("faqPopup");
const paymentsPopup = document.getElementById("paymentsPopup");

document.querySelectorAll(".closePopup").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.target.closest(".popup").classList.add("hidden");
  });
});

faqBtn.addEventListener("click", () => {
  faqPopup.classList.toggle("hidden");
  paymentsPopup.classList.add("hidden");
});

paymentsBtn.addEventListener("click", () => {
  paymentsPopup.classList.toggle("hidden");
  faqPopup.classList.add("hidden");
});

async function getInvoiceFromLightningAddress(address, sats) {
  const [name, domain] = address.split("@");
  const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${name}`;

  const lnurlpRes = await fetch(lnurlpUrl).then((r) => r.json());

  const callback = lnurlpRes.callback;
  const msats = sats * 1000;

  const invoiceRes = await fetch(`${callback}?amount=${msats}`).then((r) =>
    r.json(),
  );

  return invoiceRes.pr;
}

function showEndScreen() {
  const endScreen = document.getElementById("endScreen");
  const finalStats = document.getElementById("finalStats");

  const accuracy =
    totalClicks > 0 ? Math.round((score / totalClicks) * 100) : 0;

  finalStats.innerHTML = `
    <strong>Final Score:</strong> ${score}<br>
    <strong>Total Clicks:</strong> ${totalClicks}<br>
    <strong>Accuracy:</strong> ${accuracy}%
  `;

  endScreen.classList.remove("hidden");
  document.getElementById("claimRewardBtn").onclick = () => {
    window.payForScore(score);
  };
}
