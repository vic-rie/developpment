import pandas as pd

import functions as module


# Paths
basepath_ = "Users/Elève/Desktop/developpment"
albumTablePath = f"C:/{basepath_}/frontend/albumsTable.xlsx"

# Charger JSON
dfData = module.load_data("tracks.json").drop_duplicates(ignore_index=True)


def generate_albumsTable(dfData):
    
    print("Création de albumsTable")

    # Création de albumsTable
    dfArtistsAlbums = dfData[["artist", "album"]].copy().drop_duplicates(ignore_index=True).sort_values(by=["artist", "album"], ignore_index=True)
    albumsTable = pd.DataFrame(data = dfArtistsAlbums, columns = ["artist", "album", "albumAvailableTracks"], index = dfArtistsAlbums.index)

    for i in range(len(albumsTable)):

        artist = albumsTable.loc[i, "artist"]
        album = albumsTable.loc[i, "album"]

        dfDataAlbum = dfData[(dfData["artist"] == artist) & (dfData["album"] == album)]
        albumAvailableTracks = int(dfDataAlbum.count().iloc[0])

        albumsTable.loc[i, "albumAvailableTracks"] = albumAvailableTracks

    return albumsTable


albumsTable = generate_albumsTable(dfData)

print("Ecriture dans 'artistsTable.xlsx'")
with pd.ExcelWriter(albumTablePath) as writer:
    albumsTable.to_excel(writer, index=False)