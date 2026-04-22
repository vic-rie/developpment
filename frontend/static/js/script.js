window.addEventListener("load", () => {
    document.getElementById("nom").value = "";
});



const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(button => {
    button.addEventListener("click", () => {

        // Retirer active de tous les boutons
        tabButtons.forEach(btn => btn.classList.remove("active"));

        // Cacher tous les contenus
        tabContents.forEach(tab => tab.classList.remove("active"));

        // Activer le bon bouton
        button.classList.add("active");

        // Afficher le bon contenu
        const target = document.getElementById(button.dataset.tab);
        target.classList.add("active");

        // Vider les boîtes de texte
        document.getElementById("nom").value = "";
        filtrerAvecDebounce();
    });
});




// Recherche avec la barre de recherche
function normalize(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "");
}


// Fonction pout éviter le filtre à chaque lettre (lag)
function debounce(func, delay) {
    let timeout;

    return function() {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            func();
        }, delay);
    };
}


const rows = Array.from(document.querySelectorAll(".track-row"));

const tracksData = rows.map(row => ({
    element: row, // référence DOM
    text: normalize(
        row.querySelector(".titleList").textContent +
        " " +
        row.querySelector(".artistList").textContent +
        " " +
        row.children[3].textContent
    )
}));


function filtrerTable() {

    const input = document.getElementById("nom").value.trim();

    const tbody = document.getElementById("music-body");

    // reset affichage
    tbody.innerHTML = "";
    loadedCount = 0;

    if (input === "") {
        isSearching = false;
        loadMoreTracks();
        return;
    }

    const mots = normalize(input).split(" ").filter(m => m !== "");

    filteredTracks = allTracks.filter(track => {

        const text = normalize(
            track.track + " " +
            track.artist + " " +
            track.album
        );

        return mots.every(mot => text.includes(mot));
    });

    isSearching = true;

    loadMoreTracks();
}


// Recherche en tapant dans la barre
const searchInput = document.getElementById("nom");
const filtrerAvecDebounce = debounce(filtrerTable, 500);
searchInput.addEventListener("input", filtrerAvecDebounce);






// MEDIA CONTROL BAR
const playButtons = document.querySelectorAll(".playBtn");
const audio = document.getElementById("audio");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const trackName = document.getElementById("trackName");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time");

let playlist = [];
let index_playlist = 0;

let allTracks = [];
let loadedCount = 0;
const step = 50;

let filteredTracks = [];
let isSearching = false;

// récupérer la playlist depuis Flask
Promise.all([
    fetch("/playlist").then(res => res.json()),
    fetch("/tracks").then(res => res.json())
])
.then(([dataPath, dataTable]) => {

    playlist = dataPath;
    allTracks = dataTable.map((track, index) => ({
        ...track,
        realIndex: index
    }));

    console.log("playlist OK", playlist.length);
    console.log("tracks OK", allTracks.length);

    loadTrack(index_playlist);
    highlightTrack(index_playlist);
    loadMoreTracks();
});


window.addEventListener("scroll", () => {

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {

        if (loadedCount < allTracks.length) {
            loadMoreTracks();
        }
    }
});


function loadMoreTracks() {

    const tbody = document.getElementById("music-body");
    const source = isSearching ? filteredTracks : allTracks;
    const end = Math.min(loadedCount + step, source.length);
    const newRows = [];

    for (let i = loadedCount; i < end; i++) {

        const track = source[i];

        const row = document.createElement("tr");
        row.classList.add("track-row");
        row.dataset.index = i + 1; // affichage
        row.dataset.realIndex = track.realIndex; // logique réelle
        row.dataset.artist = track.artist;
        row.dataset.album = track.album;

        row.innerHTML = `
            <td>${track.realIndex + 1}</td>
            <td>
                <img src="/images/default-cover.jpg" class="albumCoverList">
            </td>
            <td>
                <div class="titleList">${track.track}</div>
                <div class="artistList">${track.artist}</div>
            </td>
            <td>${track.album}</td>
            <td>${track.duration}</td>
        `;

        tbody.appendChild(row);
        newRows.push(row);
    }

    loadedCount = end;

    updateImages(newRows);
}


function updateImages(rows) {

    rows.forEach(row => {
        const index = row.dataset.realIndex;
        const artist = row.dataset.artist;
        const album = row.dataset.album;
        const img = row.querySelector("img");

        if (playlist[index]) {
            img.src = `/images/${artist} - ${album}.jpg`;
            img.onerror = () => {
            img.src = "/images/available_default-cover.jpg";
            };
        } else {
            img.src = "/images/not_available_default-cover.jpg";;
            row.style.opacity = "0.7";
        }
    });
}

function loadTrack(i){

    console.log(i)
    audio.src = playlist[i];
    const name = playlist[i].split("/").pop().split(".")[0];
    trackName.textContent = name;
}

function playTrack(i) {

    const audio = document.getElementById("audio");

    loadTrack(i);
    audio.play();
    playButtons.forEach(btn => {btn.classList.remove("play"); btn.classList.add("pause");});
    highlightTrack(i);
}

function highlightTrack(index) {

    const rows = document.querySelectorAll(".track-row");

    rows.forEach(row => {
        row.classList.remove("active-track");
    });

    // const activeRow = document.querySelector(`.track-row[data-index="${index + 1}"]`);
    const activeRow = document.querySelector(`.track-row[data-real-index="${index}"]`);

    if (activeRow) {
        activeRow.classList.add("active-track");
    }
}


document.querySelector(".music-table tbody").addEventListener("click", (e) => {

    const row = e.target.closest(".track-row");
    if (!row) return;

    // index_playlist = row.dataset.index - 1;
    index_playlist = parseInt(row.dataset.realIndex);

    if (playlist[index_playlist]) {
        playTrack(index_playlist);
    }
});


// // play / pause
function togglePlay() {
    if(audio.paused){
        audio.play();
        playButtons.forEach(btn => {
            btn.classList.remove("play");
            btn.classList.add("pause");
        });
    } else {
        audio.pause();
        playButtons.forEach(btn => {
            btn.classList.remove("pause");
            btn.classList.add("play");
        });
    }
}

playButtons.forEach(btn => {
    btn.addEventListener("click", togglePlay);
});


// Contrôles playlist
function nxtTrack(index) {

    index++;
    if(index >= playlist.length){
        index = 0;
    }
    while (!playlist[index]) {
        index++;
        if(index >= playlist.length){
            index = 0;
        }
    }
    playTrack(index);
    return index;
}

function prvTrack(index) {

    index--;
    if(index < 0){
        index = playlist.length - 1;
    }
    while (!playlist[index]) {
        index--;
        if(index < 0){
                index = playlist.length - 1;
        }
    }
    playTrack(index);
    return index;
}

// musique suivante
nextBtn.addEventListener("click", () => {
    index_playlist = nxtTrack(index_playlist);
});

// musique précédente
prevBtn.addEventListener("click", () => {
    index_playlist = prvTrack(index_playlist);
});

// lecture automatique suivante
audio.addEventListener("ended", () => {
    index_playlist = nxtTrack(index_playlist);
});


// Mettre à jour la barre de progression
audio.addEventListener("timeupdate", () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.value = percent || 0;

    const formatTime = (t) => {
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    timeDisplay.textContent =
        `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
});

// Permet de cliquer sur la barre pour avancer
progress.addEventListener("input", () => {
    const newTime = (progress.value / 100) * audio.duration;
    audio.currentTime = newTime;
});