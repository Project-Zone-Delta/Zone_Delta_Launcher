let interval;

const radio = new Audio('http://radio.zone-delta.xyz/listen/zone_delta/radio.mp3');

const homeRadioButton = document.getElementsByClassName('radio-home-button')?.[0];

/**
 * @type {HTMLImageElement | undefined}
 */
const radioImage = document.getElementsByClassName('musique-img')?.[0];
const radioTitle = document.getElementsByClassName('musique-title')?.[0];
const authorName = document.getElementsByClassName('author-title')?.[0];
const albumTitle = document.getElementsByClassName('album-title')?.[0];

const timeDisplay = document.querySelector(".time-display");
const song_progress = document.getElementById('song-progress');
const song_time_elapsed = document.getElementsByClassName("time-display-played")?.[0];
const song_time_total = document.getElementsByClassName("time-display-total")?.[0];

function loadRadio() {
    initBtn();
    loadNowPlaying();
    loadSongProgress();

    if (!interval) {
        interval = setInterval(() => {
            if (!radio.paused) loadNowPlaying();
        }, 5_000);
    }

    homeRadioButton.onclick = () => {
        switchView(getCurrentView(), VIEWS.landing);
    };
}

/**
 * @param {SVGElement} playButton
 * @param {SVGElement} pauseButton
 * @return {void}
 */
function toggleButtons(playButton, pauseButton) {
    playButton.classList.toggle('hidden');
    pauseButton.classList.toggle('hidden');

    if (radio.paused) {
        radio.load();
        radio.play();
    } else {
        radio.pause();
    }
}

function initBtn() {
    const playButton = document.getElementsByClassName('play')?.[0];
    const pauseButton = document.getElementsByClassName('pause')?.[0];

    const btnCb = () => toggleButtons(playButton, pauseButton);

    if (playButton) playButton.onclick = btnCb;
    if (pauseButton) pauseButton.onclick = btnCb;


    const progressBar = document.getElementById('progress-bar');
    const volumeText = document.getElementsByClassName('slider-value')?.[0];
    const volumeBar = document.getElementsByClassName('volume-bar')?.[0];

    if (!volumeBar || !volumeText || !progressBar) return;

    volumeBar.oninput = () => {
        progressBar.setAttribute('value', volumeBar.value);
        volumeText.textContent = volumeBar.value + '%';

        radio.volume = +volumeBar.value / 100;
    };
}

let np = null

async function loadNowPlaying() {
    let res = await fetch("http://45.154.96.199:83/api/nowplaying/1")

    if (res.status === 200)
        res = await res.json()

    is_live = res?.live?.is_live

    if (is_live) {
        timeDisplay.style.display = 'none'
        song_progress.setAttribute('max', 0)
        song_progress.setAttribute('value', 0)
        authorName.textContent = `Streamer : ${res.live.streamer_name}`;
    } else {
        timeDisplay.style.display = 'flex'
        song_progress.setAttribute('max', res.now_playing.duration)
    }

    if (res?.now_playing?.song) {
        albumTitle.textContent = res.now_playing.song.artist;
        radioImage.src = res.now_playing.song.art;
        document.documentElement.style.setProperty('--url-radio', `url('${res.now_playing.song.art}')`);
    }

    np = res?.now_playing;

    radioTitle.textContent = res.now_playing.song.title;
}
let currentTime
let is_live
async function loadSongProgress() {
    setInterval(
        () => {
            currentTime = Math.floor(Date.now() / 1000);

            if (np == null || radio.paused || is_live)
                return;

            let currentTrackPlayedAt = np.played_at ?? 0;
            let elapsed = currentTime - currentTrackPlayedAt;

            if (elapsed < 0) {
                elapsed = 0;
            } else if (elapsed >= np.duration) {
                elapsed = np.duration;
            }

            song_progress.setAttribute('value', elapsed)
            song_progress.style.width = np.duration + "px"
            song_time_elapsed.textContent = formatTime(elapsed)
            song_time_total.textContent = formatTime(np.duration)
        },
        100
    );
}

radioImage.onload = () => {
    const { r, g, b } = getColorAverage();
    if (r*0.299 + g*0.587 + b*0.114 > 120) {
        document.documentElement.style.setProperty('--button-bg-color', '#000');
        document.documentElement.style.setProperty('--button-fg-color', '#fff');
    } else {
        document.documentElement.style.setProperty('--button-bg-color', '#fff');
        document.documentElement.style.setProperty('--button-fg-color', '#000');
    }
};


/**
 * Author: pioupia (https://github.com/pioupia)
 * Made the 13th of May 2023
 * Licence: creative common. Need to be credited
 */

/**
 * Get the color average under the "home" button
 * @return {{r: number, g: number, b: number}}
 */
function getColorAverage() {
    const canvas = document.createElement('canvas');
    canvas.height = radioImage.naturalHeight || radioImage.offsetHeight || radioImage.height;
    canvas.height = radioImage.naturalWidth || radioImage.offsetWidth || radioImage.width;

    const ctx = canvas.getContext('2d');

    const defaultLayers = {
        r: 0,
        g: 0,
        b: 0
    };

    ctx.drawImage(radioImage, 0, 0);

    try {
        const midWidth = Math.floor(canvas.width / 4);
        const midHeight = Math.floor(canvas.height / 2);

        const data = ctx.getImageData(midWidth, midHeight, canvas.width - midWidth, canvas.height - Math.floor(midHeight / 2));
        const len = data.data.length;

        for (let i = 0; i < len; i += 4) {
            defaultLayers.r += data.data[i];
            defaultLayers.g += data.data[i+1];
            defaultLayers.b += data.data[i+2];
        }

        const pixelCount = Math.floor(len / 4);
        defaultLayers.r /= pixelCount;
        defaultLayers.g /= pixelCount;
        defaultLayers.b /= pixelCount;

    } catch(_) { /* empty */ }

    return defaultLayers;
}

function formatTime(seconds) {
    seconds = parseInt(seconds);

    let d = Math.floor(seconds / 86400),
        h = Math.floor(seconds / 3600) % 24,
        m = Math.floor(seconds / 60) % 60,
        s = seconds % 60;

    return (d > 0 ? d + 'd ' : '')
        + (h > 0 ? ('0' + h).slice(-2) + ':' : '')
        + ('0' + m).slice(-2) + ':'
        + ('0' + s).slice(-2);
}

document.addEventListener('keyup', (e) => {
    if(getCurrentView() === VIEWS.radio){
        if(e.key === 'Escape'){
            switchView(getCurrentView(), VIEWS.landing)
        }
    }
})