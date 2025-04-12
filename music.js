const music = {
    volume: 0.7,
    menuTracks: [
        "menu1.ogg",
        "menu2.ogg",
        "menu3.ogg"
    ],
    gameTracks: [
        "game1.ogg",
        "game2.ogg",
        "game3.ogg",
        "game4.ogg",
        "game5.ogg",
        "game6.ogg",
        "game7.ogg",
        "game8.ogg",
        "game9.ogg"
    ],
    bossTrack: "game2.ogg"
};

let currentTrack = 0;
let isPlaying = false;
let currentMenuTrack = null;
let isBossMusicPlaying = false;

// Главная функция воспроизведения
function playTrack(trackPath, isMusic = true) {
    const target = isMusic ? Vars.music : Vars.sound;
    if (target.isPlaying) {
        target.stop();
    }
    
    const track = target.load(trackPath);
    track.volume = music.volume;
    track.play();
    return track;
}

// Циклическое воспроизведение игровых треков
function playGameMusic() {
    if (music.gameTracks.length === 0 || isBossMusicPlaying) return;

    const track = playTrack(music.gameTracks[currentTrack]);
    currentTrack = (currentTrack + 1) % music.gameTracks.length;

    track.onEnd = () => {
        if (Vars.state.isGame() || Vars.state.isCampaign()) {
            playGameMusic();
        }
    };
}

// Рандомный трек для меню
function playRandomMenuTrack() {
    const randomIndex = Math.floor(Math.random() * music.menuTracks.length);
    currentMenuTrack = music.menuTracks[randomIndex];
    playTrack(currentMenuTrack);
}

// Обработчики событий
Events.on(EventType.ClientLoad, async () => {
    // Предзагрузка ресурсов
    await Promise.all(music.gameTracks.map(t => Vars.music.load(t)));
    await Promise.all(music.menuTracks.map(t => Vars.music.load(t)));
});

Events.on(EventType.MenuEnter, () => {
    playRandomMenuTrack();
});

Events.on(EventType.GameStart, () => {
    if (!isPlaying && !isBossMusicPlaying) {
        playGameMusic();
        isPlaying = true;
    }
});

// Основные события кампании
Events.on(EventType.SectorCapture, () => {
    if (Vars.state.isCampaign() && !isBossMusicPlaying) playGameMusic();
});

Events.on(EventType.WaveEvent, () => {
    if (Vars.state.isCampaign() && !isBossMusicPlaying) playGameMusic();
});

Events.on(EventType.BossSpawn, () => {
    if (!isBossMusicPlaying) {
        isBossMusicPlaying = true;
        playTrack(music.bossTrack);
        if (isPlaying) {
            Vars.music.stop(); // Остановка основной музыки
        }
    }
});

Events.on(EventType.BossDefeat, () => {
    isBossMusicPlaying = false;
    playGameMusic(); // Включаем основную музыку после смерти босса
});

// Следим за изменением состояния игры
Events.on(EventType.StateChange, () => {
    if (Vars.state.isCampaign() && !isPlaying && !isBossMusicPlaying) {
        playGameMusic();
    } else if (Vars.state.isMenu() || Vars.state.isEditor()) {
        isPlaying = false;
        if (isBossMusicPlaying) {
            Vars.music.stop(); // Остановка музыки при выходе в меню или редактор
            isBossMusicPlaying = false; // Сброс состояния босса
        }
    }
});
