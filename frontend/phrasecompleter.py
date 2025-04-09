# import google.generativeai as genai
import time
import csv
import os
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# Configure Gemini
# genai.configure(api_key=GEMINI_API_KEY)
# model = genai.GenerativeModel('gemini-pro')  # Using gemini-pro for text tasks

# Liste des phrases à traiter
phrases = [
    "{Blank} chat dort paisiblement sur le canapé gris.",
    "Nous avons {Blank} longtemps dans la forêt humide.",
    "Elle prépare une tarte aux {Blank} pour demain.",
    "Il lit un {Blank} captivant près de moi.",
    "J’ai vu un renard près du {Blank} moulin.",
    "Nous irons {Blank} la plage {Blank} fait beau.",
    "Elle chante {Blank} {Blank} la douche chaque matin.",
    "Le facteur apporte une lettre {Blank} sa {Blank}",
    "{Blank} a cassé {Blank} chaise sans le vouloir.",
    "Tu devrais dormir {Blank} peu plus la {Blank}",
    "{Blank} {Blank} mangé des {Blank} à la fraise.",
    "Ils ont {Blank} le {Blank} avec beaucoup {Blank}",
    "{Blank} porte un {Blank} bizarre pour {Blank} fête.",
    "Cette {Blank} est {Blank} bruyante {Blank} vendredi soir.",
    "Elle rêve {Blank} {Blank} {Blank} du monde entier.",
    "On entend {Blank} vent {Blank} fort {Blank} {Blank}",
    "{Blank} {Blank} {Blank} marche lentement dans {Blank} neige.",
    "{Blank} {Blank} cette {Blank} {Blank} trop chère hélas.",
    "{Blank} {Blank} les étoiles allongé {Blank} le {Blank}",
    "{Blank} {Blank} {Blank} pour un {Blank} voyage extraordinaire.",
    "Tu devrais appeler {Blank} mère {Blank} {Blank} {Blank}",
    "{Blank} parlent {Blank} en {Blank} temps {Blank} {Blank}",
    "{Blank} soleil {Blank} {Blank} {Blank} {Blank} hautes montagnes.",
    "{Blank} fromage {Blank} très mauvais {Blank} {Blank} {Blank}",
    "{Blank} porte toujours {Blank} chaussures {Blank} {Blank} {Blank}",
    "{Blank} t’ai {Blank} {Blank} {Blank} {Blank} le quartier.",
    "{Blank} {Blank} {Blank} {Blank} {Blank} la {Blank} tempête.",
    "Mon {Blank} {Blank} {Blank} puzzles {Blank} {Blank} {Blank}",
    "{Blank} maison {Blank} {Blank} {Blank} plusieurs {Blank} {Blank}",
    "J'ai {Blank} {Blank} {Blank} {Blank} {Blank} {Blank} public.",
    "{Blank} {Blank} {Blank} ri {Blank} {Blank} {Blank} {Blank}",
    "{Blank} {Blank} pleure {Blank} {Blank} {Blank} {Blank} {Blank}",
    "{Blank} {Blank} les {Blank} {Blank} {Blank} {Blank} {Blank}"
]

def complete_sentence(phrase):
    """Uses Mistral to complete a sentence with blanks."""
    prompt = (
        "Voici une phrase avec des espaces marqués par {Blank}. "
        "Supprime les {Blank} et complète la phrase pour qu'elle soit grammaticalement correcte "
        "en français. Si la phrase ne peut pas être complétée correctement, réponds par 'Not possible.'\n\n"
        f"Phrase à compléter: {phrase}\n\n"
        "Retourne uniquement la phrase complétée, sans explications ni commentaires additionnels."
    )
    
    try:
        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "mistral-large-latest",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 100
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        completed = response.json()["choices"][0]["message"]["content"].strip()
        
        # Basic validation
        if not completed or "not possible" in completed.lower():
            return "Not possible."
            
        return completed
        
    except Exception as e:
        print(f"Erreur lors de l'appel API pour la phrase : {phrase}\nDétail : {e}")
        return "Not possible."

# Traitement des phrases une par une
results = []
for phrase in phrases:
    completed = complete_sentence(phrase)
    results.append((phrase, completed))
    print("Original:", phrase)
    print("Completed:", completed)
    print("-" * 50)
    # Pause pour respecter les limites de l'API
    time.sleep(0.5)

# Enregistrer les résultats dans un fichier CSV
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "completed_phrases.csv")

with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Original Sentence", "Completed Sentence"])
    for original, completed in results:
        writer.writerow([original, completed])

print(f"\nTraitement terminé. Les résultats ont été enregistrés dans: {csv_path}")
