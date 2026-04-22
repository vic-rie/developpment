import os
from mutagen.mp3 import MP3

import functions as module


def durationToMinutes(seconds):
    if seconds is None:
        return "--:--"
    minutes = int(seconds // 60)
    sec = int(seconds % 60)
    return f"{minutes}:{sec:02d}"

def durationToHours(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours} h {minutes} min"


def countingTracks(timingsPaths, AUDIO_FOLDER, dfDataJSON):

    durations = []
    totalDuration = 0
    availableTracks = 0

    file = open(timingsPaths, "w", encoding="utf-8")

    for i in range(len(dfDataJSON)):
        row = dfDataJSON.iloc[i]

        path = f"{AUDIO_FOLDER}/{row['artist']} - {row['track']}.mp3"

        if os.path.exists(path):
            audio = MP3(path)
            durationSeconds = audio.info.length
            duration = durationToMinutes(durationSeconds)

            totalDuration += durationSeconds
            availableTracks += 1
            
        else:
            duration = durationToMinutes(None)

        durations.append(duration)

    
    file.write(f"{availableTracks}\n")
    file.write(f"{durationToHours(totalDuration)}\n")

    for i in range(len(dfDataJSON) - 1):
        file.write(f"{durations[i]};")
    file.write(f"{durations[len(dfDataJSON) - 1]}")

    file.close() 


# basepath_ = "Users/Elève/Desktop/developpment"
# timingsPaths = f"C:/{basepath_}/frontend/timings_local.txt"
# AUDIO_FOLDER = "C:/Users/Elève/Desktop/developpment/frontend/static/audio"  # chemin local
# dfDataJSON = module.load_data("tracks.json")

# countingTracks(timingsPaths, AUDIO_FOLDER, dfDataJSON)
# file = open(f"C:/{basepath_}/frontend/timings_local.txt")

# availableTracks = file.readline().rstrip('\n')
# totalDurationInHours = file.readline().rstrip('\n')
# durations = file.readline().split(";")

# print(availableTracks)
# print(totalDurationInHours)
# print(durations)