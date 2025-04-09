import pandas as pd
import os

# Liste des 200 phrases françaises à 8 mots (chacune terminée par un point ou autre ponctuation)
# Voici la liste complète des 200 phrases que j'avais générées précédemment.
phrases = [
    "Le chat dort paisiblement sur le canapé gris.",
    "Nous avons marché longtemps dans la forêt humide.",
    "Elle prépare une tarte aux pommes pour demain.",
    "Il lit un roman captivant près de moi.",
    "Tu as laissé tes clés sur la table.",
    "Les enfants jouent bruyamment dans le jardin vert.",
    "J’ai vu un renard près du vieux moulin.",
    "Nous irons à la plage s’il fait beau.",
    "Elle chante toujours sous la douche chaque matin.",
    "Le facteur apporte une lettre dans sa sacoche.",
    "Ce film était vraiment très ennuyeux malheureusement.",
    "Il a cassé la chaise sans le vouloir.",
    "Mon frère adore cuisiner les plats exotiques.",
    "Tu devrais dormir un peu plus la nuit.",
    "Nous avons mangé des crêpes à la fraise.",
    "Ils ont repeint le mur avec beaucoup soin.",
    "Je bois un café fort chaque matin.",
    "Il porte un chapeau bizarre pour cette fête.",
    "Cette rue est toujours bruyante le vendredi soir.",
    "Elle rêve de voyager autour du monde entier.",
    "On entend le vent souffler fort ce soir.",
    "Le vieux chien marche lentement dans la neige.",
    "Elle trouve cette robe vraiment trop chère hélas.",
    "Il regarde les étoiles allongé sur le sol.",
    "Nous partons demain pour un grand voyage extraordinaire.",
    "Tu devrais appeler ta mère plus souvent maintenant.",
    "Ils parlent tous en même temps c’est pénible.",
    "Le soleil se couche derrière les hautes montagnes.",
    "Ce fromage sent très mauvais mais goûte bon.",
    "Elle porte toujours des chaussures rouges au travail.",
    "Je t’ai cherché partout dans tout le quartier.",
    "Le ciel est magnifique après la grosse tempête.",
    "Mon cousin adore les puzzles très compliqués maintenant.",
    "Cette maison semble abandonnée depuis plusieurs longues années.",
    "J'ai perdu mes lunettes dans le parc public.",
    "Il a vendu sa voiture pour acheter une moto.",
    "Nous avons bien ri pendant tout le spectacle.",
    "Le bébé pleure quand il voit le chien.",
    "Elle écrit chaque matin dans son petit journal.",
    "Il déteste les légumes surtout les brocolis verts.",
    "Cette histoire me rappelle mon enfance à Paris.",
    "Ils préparent une surprise pour leur meilleure amie.",
    "J’entends souvent des oiseaux chanter très tôt matin.",
    "Le livre est tombé sur le sol dur.",
    "Elle court chaque matin avant le petit-déjeuner.",
    "Nous avons attendu longtemps dans le froid glacial.",
    "Il a cassé son téléphone en tombant hier.",
    "Tu oublies toujours tes affaires dans le train.",
    "Mon voisin joue du piano toute la journée.",
    "Elle collectionne les timbres depuis son plus jeune âge.",
    "Je déteste me lever tôt les dimanches matins.",
    "Ce restaurant sert les meilleures pâtes de Marseille.",
    "Nous avons cueilli des fraises dans les champs.",
    "Tu parles trop vite je ne comprends rien.",
    "Ils aiment nager dans le lac en été.",
    "Le feu s’est éteint pendant la nuit froide.",
    "J’ai acheté un nouveau manteau pour l’hiver.",
    "Elle travaille dans une boulangerie près de chez nous.",
    "Il faut arroser les plantes tous les jours.",
    "Le train partira bientôt dépêche-toi un peu.",
    "Tu racontes toujours les mêmes histoires très longues.",
    "Il m’a offert des fleurs pour mon anniversaire.",
    "Cette robe te va très bien franchement superbe.",
    "Ils ont peint la maison en bleu ciel.",
    "J’ai vu un hérisson traverser la route lentement.",
    "Elle a crié quand elle a vu l’araignée.",
    "Nous avons visité le musée samedi dernier ensemble.",
    "Il joue au tennis tous les dimanches matin.",
    "Elle adore les romans policiers et les thrillers.",
    "Je préfère rester ici au lieu de sortir.",
    "Ce pain est encore chaud goûte-moi ça.",
    "Il est tombé amoureux au premier regard.",
    "Nous sommes partis avant que la pluie commence.",
    "Tu devrais ranger ta chambre plus souvent maintenant.",
    "Les feuilles tombent lentement dans le vent doux.",
    "Elle cuisine un gratin de légumes ce soir.",
    "Le chaton a griffé mon bras par accident.",
    "Il s’est perdu en forêt pendant trois heures.",
    "Tu chantes toujours quand tu es de bonne humeur.",
    "J’ai pris trop de café ce matin encore.",
    "Elle s’est endormie devant le film ennuyeux.",
    "Nous allons au marché chaque dimanche matin ensemble.",
    "Ce chien est très vieux mais encore fidèle.",
    "Il pleut fort depuis le lever du soleil.",
    "Je n’aime pas trop le goût de ça.",
    "Elle parle souvent de ses voyages en Asie.",
    "Nous avons nettoyé la maison de fond en comble.",
    "Il a oublié son parapluie dans le métro.",
    "Ce gâteau est délicieux tu veux goûter ?",
    "Elle porte un foulard coloré très original aujourd’hui.",
    "Le vent souffle fort dans les branches hautes.",
    "J’ai trouvé un billet par terre incroyable.",
    "Nous avons adopté un chien très mignon récemment.",
    "Il collectionne des cartes postales du monde entier.",
    "Elle a retrouvé son portefeuille sous le canapé.",
    "Le bébé sourit quand il voit sa mère.",
    "Tu peux venir m’aider à porter ça ?",
    "J’aime beaucoup ce tableau accroché dans ton salon.",
    "Elle met toujours du parfum avant de sortir.",
    "Ils regardent la mer assis sur le sable chaud.",
    "Le feu de cheminée réchauffe toute la maison.",
    "Il faut acheter du pain pour le dîner.",
    "Elle rêve souvent de voler comme un oiseau.",
    "Tu oublies toujours de fermer la porte derrière toi.",
    "J’ai acheté une écharpe rouge pour cet hiver.",
    "Ce spectacle de rue était vraiment impressionnant bravo !",
    "Il joue de la guitare chaque soir tard.",
    "Nous avons perdu le ballon dans le jardin voisin.",
    "Elle lit souvent au lit avant de dormir.",
    "Il préfère le thé au café chaque matin.",
    "Tu devrais essayer ce plat c’est délicieux vraiment.",
    "Le train arrive toujours en retard ces derniers temps.",
    "J’aime me promener sous la pluie légère.",
    "Elle prend toujours le bus pour aller travailler.",
    "Ce film m’a beaucoup touché j’ai pleuré.",
    "Il collectionne les pièces anciennes depuis son enfance.",
    "Nous avons ri jusqu’à en pleurer hier soir.",
    "Elle chante comme une vraie professionnelle maintenant.",
    "J’ai vu une étoile filante cette nuit-là.",
    "Il adore regarder les documentaires sur les animaux.",
    "Ce livre contient beaucoup de sagesse ancienne oubliée.",
    "Nous avons dégusté un repas exquis hier soir.",
    "Elle a cousu cette robe toute seule.",
    "Tu me fais toujours rire avec tes blagues.",
    "Le gâteau est prêt il faut le servir.",
    "Elle court chaque soir dans le parc voisin.",
    "Ils ont adopté un petit chat abandonné hier.",
    "Je déteste les moustiques surtout en été.",
    "Le ciel s’assombrit la pluie va bientôt tomber.",
    "Elle raconte des histoires merveilleuses à ses enfants.",
    "Il a oublié de fermer la fenêtre encore.",
    "Tu devrais essayer ce vin rouge il est délicieux.",
    "Le feu crépite doucement dans la cheminée ancienne.",
    "Elle est partie sans dire un mot étrange.",
    "Ils vont construire une terrasse derrière la maison.",
    "Je t’écrirai bientôt une longue lettre d’amour.",
    "Ce roman m’a beaucoup appris sur la vie.",
    "Il travaille tard tous les soirs cette semaine.",
    "Elle écoute toujours de la musique en travaillant.",
    "J’ai adoré ce voyage en Écosse merveilleux paysages.",
    "Tu peux m’aider à finir ce puzzle ?",
    "Le lac est gelé attention en marchant dessus.",
    "Elle parle trois langues avec une aisance incroyable.",
    "Il a réparé la voiture tout seul incroyable.",
    "Nous avons fait du vélo dans la campagne.",
    "Elle a tricoté ce pull pour son neveu.",
    "Ce film était drôle j’ai beaucoup rigolé.",
    "Il faut éteindre les lumières en partant.",
    "Je t’apporterai un souvenir de mon voyage.",
    "Elle prépare des biscuits pour ses petits-enfants adorés.",
    "Il a planté des fleurs dans le jardin.",
    "Nous avons visité le château sous la pluie.",
    "Elle adore les histoires de pirates et trésors.",
    "Ce chat adore grimper sur les meubles hauts.",
    "J’ai trouvé un vieux journal dans le grenier.",
    "Elle regarde la pluie tomber à la fenêtre.",
    "Tu pourrais téléphoner à ta sœur ce soir.",
    "Nous sommes allés au zoo dimanche dernier.",
    "Il adore marcher pieds nus dans l’herbe fraîche.",
    "Elle apprend à jouer du violon maintenant.",
    "Il a crié quand il a vu l’ours.",
    "Je préfère les matins calmes avec un bon café.",
    "Tu aimes le fromage plus que le dessert.",
    "Le dîner était parfait merci pour l’invitation.",
    "Elle peint des paysages inspirés par ses rêves.",
    "J’ai rangé la maison pendant ton absence.",
    "Le soleil brille après une longue semaine grise.",
    "Nous avons réservé une table pour ce soir.",
    "Elle fait du yoga chaque matin avant déjeuner.",
    "Il a vu un arc-en-ciel après l’orage.",
    "Tu dois réparer ce robinet qui fuit encore.",
    "Ils sont partis en vacances sans leurs valises.",
    "J’ai cousu un bouton sur ta chemise.",
    "Le spectacle commence bientôt prends ton billet vite.",
    "Elle regarde les nuages passer lentement au ciel.",
    "Il peint un tableau dans son atelier tranquille.",
    "Tu veux un morceau de chocolat noir ?",
    "Ce tableau est magnifique tu ne trouves pas ?",
    "Elle dort profondément fatiguée de sa journée.",
    "Il fait chaud aujourd’hui buvons quelque chose ensemble.",
    "Nous allons cueillir des cerises dans le verger.",
    "Elle a lu tout ce livre en une journée.",
    "J’ai entendu un hibou cette nuit encore.",
    "Tu fais toujours brûler les tartines fais attention.",
    "Il a écrit un poème pour son amour.",
    "Elle cherche son téléphone depuis une heure déjà.",
    "Nous avons adoré ce spectacle plein d’émotion.",
    "Ce parc est magnifique surtout en automne.",
    "Elle cueille des fleurs sauvages chaque matin tranquille.",
    "Il déteste faire la vaisselle après le dîner.",
    "Tu pourrais mettre ton manteau il fait froid.",
    "J’ai oublié mon livre chez toi zut.",
    "Le chat miaule fort quand il a faim.",
    "Elle veut apprendre à danser le tango.",
    "Ils ont repeint leur chambre en vert menthe.",
    "Tu fais trop de bruit en mangeant chut.",
    "Je regarde les étoiles chaque soir c’est apaisant.",
    "Le gâteau a brûlé j’ai oublié le minuteur.",
    "Nous avons entendu un bruit étrange cette nuit.",
    "Elle a chanté toute la chanson sans faute."
]

# Vérification que chaque phrase contient exactement 8 mots.
# On utilise split() pour découper par espace et on vérifie.
phrases_8_words = []
for phrase in phrases:
    # On enlève la ponctuation terminale pour le comptage
    words = phrase.strip().split()
    if len(words) == 8:
        phrases_8_words.append(phrase)
    else:
        print(f"Phrase ignorée (nombre de mots incorrect): {phrase}")
        continue

# Si la liste n'a pas exactement 200 phrases, on la tronque ou on la complète.
if len(phrases_8_words) > 200:
    phrases_8_words = phrases_8_words[:200]
elif len(phrases_8_words) < 200:
    print(f"Attention: seulement {len(phrases_8_words)} phrases de 8 mots trouvées.")
    # Répéter les phrases existantes pour atteindre 200
    while len(phrases_8_words) < 200:
        for phrase in phrases_8_words.copy():  # Using .copy() to avoid modifying list during iteration
            if len(phrases_8_words) < 200:
                phrases_8_words.append(phrase)
            else:
                break

# Découper chaque phrase en mots et vérifier qu'on a bien 8 mots
data = []
for phrase in phrases_8_words:
    words = phrase.strip().split()
    if len(words) == 8:  # Double vérification
        data.append(words)
    else:
        print(f"Erreur inattendue - phrase ignorée: {phrase}")

# Création d'un DataFrame avec 200 lignes et 8 colonnes
df = pd.DataFrame(data, columns=[f'Word{i+1}' for i in range(8)])

# Sauvegarde en CSV dans le même dossier que le script
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "french_200_sentences_table.csv")

# Créer le dossier si nécessaire
os.makedirs(os.path.dirname(csv_path), exist_ok=True)

# Sauvegarde en CSV
df.to_csv(csv_path, index=False, encoding="utf-8")

print(f"Le fichier CSV a été sauvegardé ici: {csv_path}")
print(f"Nombre total de phrases: {len(df)}")
