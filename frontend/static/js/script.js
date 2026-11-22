window.addEventListener("load", () => {
    document.getElementById("nom").value = "";
    document.getElementById("progress").value = 0;

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



const subtabButtons = document.querySelectorAll(".subtab-btn");
const subtabContents = document.querySelectorAll(".subtab-content");

subtabButtons.forEach(button => {
    button.addEventListener("click", () => {

        // Retirer active de tous les boutons
        subtabButtons.forEach(btn => btn.classList.remove("active"));

        // Cacher tous les contenus
        subtabContents.forEach(tab => tab.classList.remove("active"));

        // Activer le bon bouton
        button.classList.add("active");

        // Afficher le bon contenu
        const subtarget = document.getElementById(button.dataset.tab);
        subtarget.classList.add("active");

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

    if (tab1.classList.contains("active")) {
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


    if (tab3.classList.contains("active")) {
        const tbody = document.getElementById("artist-body");

        // reset affichage
        tbody.innerHTML = "";
        loadedCountArtist = 0;

        if (input === "") {
            isSearchingArtist = false;
            loadMoreArtists();
            return;
        }

        const mots = normalize(input).split(" ").filter(m => m !== "");

        filteredArtists = allArtists.filter(track => {

            const text = normalize(
                track.artist
            );

            return mots.every(mot => text.includes(mot));
        });

        isSearchingArtist = true;

        loadMoreArtists();
    }

}


// Recherche en tapant dans la barre
const searchInput = document.getElementById("nom");
const filtrerAvecDebounce = debounce(filtrerTable, 500);
searchInput.addEventListener("input", filtrerAvecDebounce);






// MEDIA CONTROL BAR
const playButtons = document.querySelectorAll(".playBtn");
const trackCover = document.querySelectorAll(".trackCover");

const audio = document.getElementById("audio");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const trackName = document.getElementById("trackName");
const trackArtist = document.getElementById("trackArtist");

const timeDisplay = document.getElementById("time");

const tooltipTitle = document.getElementById("tooltipTitle");
const tooltipArtist = document.getElementById("tooltipArtist");
const tooltipAlbum = document.getElementById("tooltipAlbum");
const tooltipDescription = document.getElementById("tooltipDescription");

let playlist = [];
let index_playlist = 0;

let allTracks = [];
let loadedCount = 0;
const step = 50;

let filteredTracks = [];
let isSearching = false;
let isSearchingArtist = false;

let filteredAlbums = [];
let isSearchingAlbums = false;

let previousTracks = [];
var j = 0;

// récupérer les tableaux de données depuis Flask
Promise.all([
    fetch("/playlist").then(res => res.json()),
    fetch("/tracks").then(res => res.json()),
    fetch("/artists").then(res => res.json()),
    fetch("/albums").then(res => res.json())
    
])
.then(([dataPath, dataTable, artistsTable, albumsTable]) => {

    playlist = dataPath;
    allTracks = dataTable.map((track, index) => ({
        ...track,
        realIndex: index
    }));
    allArtists = artistsTable;
    allAlbums = albumsTable;


    console.log("playlist OK", playlist.length);
    console.log("tracks OK", allTracks.length);
    console.log("artists OK", allArtists.length);

    loadTrack(index_playlist);
    highlightTrack(index_playlist);
    loadMoreTracks();

    loadMoreArtists();
    loadMoreAlbums();
});



window.addEventListener("scroll", () => {
    const tab1 = document.getElementById("tab1");

    if (!tab1.classList.contains("active")) {
        return;
    }

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        if (loadedCount < allTracks.length) {
            loadMoreTracks();
        }
    }
});


function loadMoreTracks() {
    console.log("Chargement tracks...");

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
    highlightTrack(index_playlist);

}


function updateImages(rows) {

    rows.forEach(row => {
        const index = row.dataset.realIndex;
        const artist = row.dataset.artist;
        const album = row.dataset.album;
        const img = row.querySelector("img");

        if (playlist[index]) {
            img.src = `/images/Covers_from_spotify/${artist} - ${album}.jpg`;
            img.onerror = () => {
            img.src = "/images/available_default-cover.jpg";
            };
        } else {
            img.src = `/images/Covers_from_spotify/${artist} - ${album}.jpg`;
            img.onerror = () => {
            img.src = "/images/not_available_default-cover.jpg";;
            };
            row.style.opacity = "0.7";
        }
    });
}









let allAlbums = [];
let loadedCountAlbums = 0;
let isLoadingAlbums = false;

const albumContainer = document.querySelector(".albumTable-container");

if (albumContainer) {
    albumContainer.addEventListener("scroll", handleAlbumScroll);
}

function handleAlbumScroll() {
    if (isLoadingAlbums) return;

    if (
        albumContainer.scrollTop + albumContainer.clientHeight >=
        albumContainer.scrollHeight - 50
    ) {
        if (loadedCountAlbums < allAlbums.length) {
            isLoadingAlbums = true;
            loadMoreAlbums();
            isLoadingAlbums = false;
        }
    }
}

function loadMoreAlbums() {
    console.log("Chargement albums...");
    const tbodyAlbum = document.getElementById("album-body");
    const source = isSearchingAlbums ? filteredAlbums : allAlbums;
    const endAlbum = Math.min(loadedCountAlbums + step, source.length);

    const fragment = document.createDocumentFragment();
    const newRowsAlbum = [];

    for (let i = loadedCountAlbums; i < endAlbum; i++) {
        const trackAlbum = source[i];

        const rowAlbum = document.createElement("tr");
        rowAlbum.classList.add("track-rowAlbum");

        rowAlbum.dataset.album = trackAlbum.album;
        rowAlbum.dataset.artist = trackAlbum.artist;
        rowAlbum.dataset.albumAvailableTracks = trackAlbum.albumAvailableTracks;

        rowAlbum.innerHTML = `
            <td>
                <img src="/images/available_default-cover.jpg" class="albumPhotoList">
            </td>
            <td>
                <div>${trackAlbum.album}</div>
            </td>
            <td>${trackAlbum.artist}</td>
            <td>${trackAlbum.albumAvailableTracks}</td>
        `;

        fragment.appendChild(rowAlbum);
        newRowsAlbum.push(rowAlbum);
    }

    tbodyAlbum.appendChild(fragment);

    loadedCountAlbums = endAlbum;

    updateImagesAlbum(newRowsAlbum);
}


function updateImagesAlbum(rows) {

    rows.forEach(row => {
        const artist = row.dataset.artist;
        const album = row.dataset.album;
        const img = row.querySelector("img");

        img.src = `/images/Covers_from_spotify/${artist} - ${album}.jpg`;
        img.onerror = () => {
        img.src = "/images/available_default-cover.jpg";

        }
    });
}


document.getElementById("album-body").addEventListener("click", (e) => {

    const row = e.target.closest(".track-rowAlbum");
    if (!row) return;

    const artistName = row.dataset.artist;
    const albumName = row.dataset.album;

    openAlbumPage(artistName, albumName);

});


function openAlbumPage(artistName, albumName) {

    // Changer d’onglet
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.getElementById("tab5").classList.add("active");


    // Charger la pochette de l'album

    const albumCoverContainer = document.querySelector(".albumCover-container");
    albumCoverContainer.innerHTML = "";

    const img = document.createElement("img");

    img.classList.add("albumCover");

    img.src = `/images/Covers_from_spotify/${artistName} - ${albumName}.jpg`;

    img.onerror = () => {
        img.src = "/images/available_default-cover.jpg";
    };

    albumCoverContainer.appendChild(img);

    // Remplir les infos
    document.getElementById("albumPageName").textContent = albumName;

    // Filtrer les tracks de cet artiste
    const albumTracks = allTracks.filter(t => t.artist === artistName & t.album === albumName);

    if (albumTracks.length == 1) {
        document.getElementById("albumPageTracks").textContent =
        `(${albumTracks.length} titre) `;
    } else {
        document.getElementById("albumPageTracks").textContent =
        `(${albumTracks.length} titres) `;        
    }


    renderAlbumTracks(albumTracks);

}



function renderAlbumTracks(tracks) {

    const tbody = document.getElementById("albumTracksBody");
    tbody.innerHTML = "";

    renderTracks(tracks, tbody);
 
}

function renderTracks(tracks, tbody) {
    const fragment = document.createDocumentFragment();
    const newRows = [];

    tracks.forEach(track => {
        const row = document.createElement("tr");
        row.classList.add("track-row");

        row.dataset.realIndex = track.realIndex;
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

        fragment.appendChild(row);
        newRows.push(row);

    });

    tbody.appendChild(fragment);
    updateImages(newRows);

    highlightTrack(index_playlist);
}

document.querySelector("#albumTracksBody").addEventListener("click", (e) => {

    const row = e.target.closest(".track-row");
    if (!row) return;

    index_playlist = parseInt(row.dataset.realIndex);

    if (playlist[index_playlist]) {
        playTrack(index_playlist);
        previousTracks = [];
    }
});


































let allArtists = [];
let loadedCountArtist = 0;
let isLoadingArtists = false;

const artistContainer = document.querySelector(".artistTable-container");

if (artistContainer) {
    artistContainer.addEventListener("scroll", handleArtistScroll);
}

function handleArtistScroll() {
    if (isLoadingArtists) return;

    if (
        artistContainer.scrollTop + artistContainer.clientHeight >=
        artistContainer.scrollHeight - 50
    ) {
        if (loadedCountArtist < allArtists.length) {
            isLoadingArtists = true;
            loadMoreArtists();
            isLoadingArtists = false;
        }
    }
}

function loadMoreArtists() {
    console.log("Chargement artistes...");
    const tbodyArtist = document.getElementById("artist-body");
    const source = isSearchingArtist ? filteredArtists : allArtists;
    const endArtist = Math.min(loadedCountArtist + step, source.length);

    const fragment = document.createDocumentFragment();
    const newRowsArtist = [];

    for (let i = loadedCountArtist; i < endArtist; i++) {
        const trackArtist = source[i];

        const rowArtist = document.createElement("tr");
        rowArtist.classList.add("track-rowArtist");

        rowArtist.dataset.artist = trackArtist.artist;
        rowArtist.dataset.tracksNumber = trackArtist.availableTracks;
        rowArtist.dataset.albumsNumber = trackArtist.availableAlbums;

        rowArtist.innerHTML = `
            <td>
                <img src="/images/available_default-cover.jpg" class="artistPhotoList">
            </td>
            <td>
                <div>${trackArtist.artist}</div>
            </td>
            <td>${trackArtist.availableTracks}</td>
            <td>${trackArtist.availableAlbums}</td>
        `;

        fragment.appendChild(rowArtist);
        newRowsArtist.push(rowArtist);
    }

    tbodyArtist.appendChild(fragment);

    loadedCountArtist = endArtist;

    updateImagesArtist(newRowsArtist);
}


function updateImagesArtist(rows) {

    rows.forEach(row => {
        const artist = row.dataset.artist;
        const img = row.querySelector("img");

        img.src = `/images/Artists_from_spotify/${artist}.jpg`;
        img.onerror = () => {
        img.src = "/images/available_default-cover.jpg";

        }
    });
}


document.getElementById("artist-body").addEventListener("click", (e) => {

    const row = e.target.closest(".track-rowArtist");
    if (!row) return;

    const artistName = row.dataset.artist;

    openArtistPage(artistName);

});


function openArtistPage(artistName) {

    // Changer d’onglet
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.getElementById("tab4").classList.add("active");

    // Remplir les infos
    document.getElementById("artistPageName").textContent = artistName;

    const artistPage = document.querySelector(".artistPage");

    artistPage.style.setProperty(
        "--artist-bg",
        `url("/images/Artists_from_spotify/${artistName}.jpg")`
    );

    // Filtrer les tracks de cet artiste
    const artistTracks = allTracks.filter(t => t.artist === artistName);

    if (artistTracks.length == 1) {
        document.getElementById("artistPageTracks").textContent =
        `(${artistTracks.length} titre, `;
    } else {
        document.getElementById("artistPageTracks").textContent =
        `(${artistTracks.length} titres, `;        
    }

    const albums = [...new Set(artistTracks.map(t => t.album))];

    if (albums.length == 1) {
        document.getElementById("artistPageAlbums").textContent =
        `${albums.length} album)`;
    } else {
                document.getElementById("artistPageAlbums").textContent =
        `${albums.length} albums)`;
    }


    renderArtistTracks(artistTracks);
    renderDiscography(artistName);

}



function renderArtistTracks(tracks) {

    const tbody = document.getElementById("artistTracksBody");
    tbody.innerHTML = "";

    renderTracks(tracks, tbody);

}

document.querySelector("#artistTracksBody").addEventListener("click", (e) => {

    const row = e.target.closest(".track-row");
    if (!row) return;

    index_playlist = parseInt(row.dataset.realIndex);

    if (playlist[index_playlist]) {
        playTrack(index_playlist);
        previousTracks = []
    }
});


function renderDiscography(artistName) {

    const grid = document.getElementById("albumsGrid");

    grid.innerHTML = "";

    // récupérer albums uniques
    const albums = [...new Set(
        allTracks
            .filter(track => track.artist === artistName)
            .map(track => track.album)
    )];

    albums.forEach(album => {

        const card = document.createElement("div");

        card.classList.add("albumCard");

        card.dataset.artist = artistName;
        card.dataset.album = album;

        card.innerHTML = `
            <img src="/images/${artistName} - ${album}.jpg">
            <div class="albumTitle">${album}</div>
            <div class="albumArtist">${artistName}</div>
        `;

        const img = card.querySelector("img");

        img.src = `/images/Covers_from_spotify/${artistName} - ${album}.jpg`;
        img.onerror = () => {
            img.src = "/images/available_default-cover.jpg";
        };

        grid.appendChild(card);
    });
}


document.getElementById("albumsGrid")
.addEventListener("click", (e) => {

    const card = e.target.closest(".albumCard");

    if (!card) return;

    const artist = card.dataset.artist;
    const album = card.dataset.album;

    console.log("Artiste :", artist);
    console.log("Album :", album);

    openAlbumPage(artist, album);

});

























function loadTrack(i){

    console.log("index =",  i);
    audio.src = playlist[i];

    const fullName = playlist[i].split("/").pop().split(".")[0];
    artistFromPath = fullName.split(" - ")[0];
    trackFromPath = fullName.split(" - ")[1];
    console.log(artistFromPath);
    console.log(trackFromPath);

    trackArtist.textContent = artistFromPath;
    trackName.textContent = trackFromPath;
    const album = allTracks[i]["album"]

    console.log(album);

    const img = document.querySelector(".coverPlayer");
    img.src = `/images/Covers_from_spotify/${artistFromPath} - ${album}.jpg`;
    img.onerror = () => {
    img.src = "/images/available_default-cover.jpg";
    };


    const img2 = document.querySelector(".coverTooltip");
    img2.src = `/images/Covers_from_spotify/${artistFromPath} - ${album}.jpg`;
    img2.onerror = () => {
    img2.src = "/images/available_default-cover.jpg";
    };
    tooltipTitle.textContent = `Titre : ${trackFromPath}`
    tooltipArtist.textContent = `Artiste : ${artistFromPath}`
    tooltipAlbum.textContent = `Album : ${album}`
    tooltipDescription.textContent = "Description ??"
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

    
    const selector = `.track-row[data-real-index="${index}"]`;

    document.querySelectorAll(selector)
        .forEach(row => row.classList.add("active-track"));

}


document.querySelector(".music-table tbody").addEventListener("click", (e) => {

    console.log("ok");
    const row = e.target.closest(".track-row");
    if (!row) return;

    index_playlist = parseInt(row.dataset.realIndex);

    if (playlist[index_playlist]) {
        playTrack(index_playlist);
        previousTracks = []
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

    if (isShuffleActive) {
        if (j === 0){

            if ( !(previousTracks.includes(index))) {
                previousTracks.push(index);
            }

            index = Math.floor(Math.random() * playlist.length);

            while (previousTracks.includes(index)) {
                index = Math.floor(Math.random() * playlist.length);
            }

        } else {
            j = j - 1;
            index = previousTracks[previousTracks.length - 1 - j];
        }

        console.log(previousTracks);
        console.log("j =", j);
        
    } else {
        index++;
    }

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


    if (isShuffleActive) {

        if (previousTracks.length === 1) {
            if (j === 0) {
                previousTracks.push(index);
                index = previousTracks[0];
                j = j + 1;
            }

        }

        if (j !== previousTracks.length - 1) {
            if (j === 0) {
                previousTracks.push(index);
            }

            j = j + 1;
            index = previousTracks[previousTracks.length - 1 - j];
        }

        console.log(previousTracks);
        console.log("j =", j);

    } else {
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



// Bouton lecture aléatoire
const randomButtons = document.querySelectorAll(".randomBtnClass");

let isShuffleActive = false;

randomButtons.forEach(button => {
    button.addEventListener("click", () => {
        isShuffleActive = !isShuffleActive;

        randomButtons.forEach(btn => {
            btn.classList.toggle("active", isShuffleActive);

            previousTracks = []
            const j = 0;
        });

        console.log("Mode aléatoire :", isShuffleActive);
        console.log("j =", j);
    });
});