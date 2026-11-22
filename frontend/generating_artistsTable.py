import pandas as pd

import functions as module


# Paths
basepath_ = "Users/Elève/Desktop/developpment"
tablePath = f"C:/{basepath_}/frontend/artistsTable.xlsx"

# Charger JSON
dfData = module.load_data("tracks.json").drop_duplicates(ignore_index=True)


def generate_artistsTable(dfData):
    
    print("Création de artistsTable")

    # Création de artistsTable
    artists = dfData["artist"].drop_duplicates(ignore_index=True).sort_values(ignore_index=True)
    artistsTable = pd.DataFrame(data = artists, columns = ["artist", "availableTracks", "availableAlbums"], index = artists.index)


    for i in range(len(artistsTable)):

        artist = artistsTable.loc[i, "artist"]

        dfDataArtist = dfData[dfData["artist"] == artist]
        tracksNumber = dfDataArtist.count().iloc[0]
        AlbumsNumber = dfDataArtist.drop_duplicates(subset = "album",ignore_index=True).count().iloc[0]

        artistsTable.loc[i, "availableTracks"] = tracksNumber
        artistsTable.loc[i, "availableAlbums"] = AlbumsNumber

    return artistsTable


artistsTable = generate_artistsTable(dfData)

artistsTable = pd.concat([artistsTable, pd.Series(name="Photo downloaded ?")])

print("Ecriture dans 'artistsTable.xlsx'")
with pd.ExcelWriter(tablePath) as writer:
    artistsTable.to_excel(writer, index=False)