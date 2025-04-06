const music = {
    volume: 0.7,
    menuTracks: [
        "music/menu1.ogg",
        "music/menu2.ogg",
        "music/menu3.ogg"
    ],
    gameTracks: [
        "music/game1.ogg",
        "music/game2.ogg",
        "music/game3.ogg",
        "music/game4.ogg",
        "music/game5.ogg",
        "music/game6.ogg",
        "music/game7.ogg",
        "music/game8.ogg",
        "music/game9.ogg"
    ],
    bossTrack: "music/boss1.ogg"
};

let currentTrack = 0;
let isPlaying = false;
let currentMenuTrack = null;

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
    if (music.gameTracks.length === 0) return;

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
    if (!isPlaying) {
        playGameMusic();
        isPlaying = true;
    }
});

// Основные события кампании
Events.on(EventType.SectorCapture, () => {
    if (Vars.state.isCampaign()) playGameMusic();
});

Events.on(EventType.WaveEvent, () => {
    if (Vars.state.isCampaign()) playGameMusic();
});

Events.on(EventType.BossSpawn, () => {
    playTrack(music.bossTrack);
});

Events.on(EventType.BossDefeat, () => {
    playGameMusic();
});

// Следим за изменением состояния игры
Events.on(EventType.StateChange, () => {
    if (Vars.state.isCampaign() && !isPlaying) {
        playGameMusic();
    } else if (Vars.state.isMenu()) {
        isPlaying = false;
    }
});
