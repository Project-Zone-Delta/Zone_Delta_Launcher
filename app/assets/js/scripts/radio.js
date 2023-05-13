let nowPlaying, nowPlayingTimeout;

function loadRadio() {
    initBtn();
    loadNowPlaying();

    setInterval(() => {
        loadNowPlaying();
    }, 15_000);
}

/**
 * @param {SVGElement} playButton
 * @param {SVGElement} pauseButton
 * @param {HTMLAudioElement} radio
 * @return {void}
 */
function toggleButtons(playButton, pauseButton, radio) {
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
    let radio = new Audio('http://radio.zone-delta.xyz/listen/zone_delta/radio.mp3');

    const playButton = document.getElementsByClassName("play")?.[0];
    const pauseButton = document.getElementsByClassName("pause")?.[0];

    const btnCb = () => toggleButtons(playButton, pauseButton, radio);

    if (playButton) playButton.onclick = btnCb;
    if (pauseButton) pauseButton.onclick = btnCb;


    const progressBar = document.getElementById("progress-bar");
    const volumeText = document.getElementsByClassName("slider-value")?.[0];
    const volumeBar = document.getElementsByClassName("volume-bar")?.[0];

    if (!volumeBar || !volumeText || !progressBar) return;

    volumeBar.oninput = () => {
        progressBar.setAttribute('value', volumeBar.value);
        volumeText.textContent = volumeBar.value + '%';

        radio.volume = +volumeBar.value / 100;
    }
}

function loadNowPlaying() {
    let img_radio = document.querySelector('.musique-img');
    let titre = document.querySelector('.musique-title');
    let author = document.querySelector('.author-title');
    let artiste_live = document.querySelector('.album-title');

    axios.get('http://45.154.96.199:83/api/nowplaying/1').then((response) => {
        nowPlaying = response.data;
        let artiste_musique
        let titre_musique
        let artiste_live_musique
        if (nowPlaying.live.is_live) {
            artiste_musique = `Streamer : ${nowPlaying.live.streamer_name}`
            titre_musique = nowPlaying.now_playing.song.title
            artiste_live_musique = nowPlaying.now_playing.song.artist
        } else {
            artiste_musique = nowPlaying.now_playing.song.artist
            titre_musique = nowPlaying.now_playing.song.title
            artiste_live_musique = "";
        }

        img_radio.setAttribute("src", nowPlaying.now_playing.song.art);
        titre.textContent = `${titre_musique}`
        author.textContent = `${artiste_musique}`
        artiste_live.textContent = `${artiste_live_musique}`
        const root = document.querySelector(":root");
        root.style.setProperty("--url-radio", `url(${nowPlaying.now_playing.song.art})`);

    }).catch((error) => {
        console.error(error);
    })
}