import subprocess
import sys

basepath_ = "Users/Elève/Desktop/developpment"
filepath = f"C:/{basepath_}/frontend/web_auto_get_url.py"
# filepath = f"C:/{basepath_}/frontend/web_auto_download_mp3.py"

def get_url_automation(filepath):
    try:
        result1 = subprocess.run([sys.executable, filepath], check=True)

    except subprocess.CalledProcessError as e:
        print(f"Erreur du programme {e.cmd}, code retour = {e.returncode}")
        print(" ")
        print(f"Ré-exécution de {e.cmd}")


i=0
while i < 100 :
    get_url_automation(filepath)