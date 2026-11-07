/* WORDSPIN puzzle library, GERMAN -- DATA ONLY, no game logic.
   Every entry is [Kategorie, Schwierigkeit, Text]. Schwierigkeit 1 = kurz und bekannt, 2 = mittel, 3 = lang oder knifflig.
   Regeln fuer neue Raetsel: Grossbuchstaben, A-Z, Ä Ö Ü, Leerzeichen, Apostroph, Bindestrich, Komma (kein ß: SS schreiben, keine Ziffern, kein "&");
   hoechstens 14 Buchstaben pro Wort und hoechstens 4 Zeilen zu 14 Feldern (die Tests pruefen das). */
const WS_PUZZLES_DE=[
/* Essen & Trinken */
['Essen & Trinken',1,'FRISCHE BRÖTCHEN'],['Essen & Trinken',1,'HEISSE SCHOKOLADE'],['Essen & Trinken',1,'APFELSTRUDEL'],['Essen & Trinken',1,'KARTOFFELSALAT'],['Essen & Trinken',1,'GRÜNER TEE'],
['Essen & Trinken',2,'SPAGHETTI MIT TOMATENSOSSE'],['Essen & Trinken',2,'EIN STÜCK ERDBEERKUCHEN'],['Essen & Trinken',2,'WARME ZIMTSCHNECKEN'],['Essen & Trinken',2,'SELBSTGEMACHTE PIZZA'],['Essen & Trinken',2,'EINE SCHÜSSEL GEMÜSESUPPE'],
['Essen & Trinken',3,'KNUSPRIGER SCHWEINEBRATEN MIT KNÖDELN'],['Essen & Trinken',3,'ZUM FRÜHSTÜCK GIBT ES FRISCHEN KAFFEE'],['Essen & Trinken',3,'FRISCHER SPARGEL MIT BUTTER UND KARTOFFELN'],['Essen & Trinken',3,'DER KUCHEN DUFTET IM GANZEN HAUS'],['Essen & Trinken',3,'EINE PRISE SALZ UND EIN SCHUSS OLIVENÖL'],
/* Orte */
['Orte',1,'DER KÖLNER DOM'],['Orte',1,'DER ALTE MARKTPLATZ'],['Orte',1,'SONNIGER STRAND'],['Orte',1,'DIE ZUGSPITZE'],['Orte',1,'BRANDENBURGER TOR'],
['Orte',2,'EIN SCHLOSS AM FLUSS'],['Orte',2,'DIE BRÜCKE ÜBER DEN RHEIN'],['Orte',2,'EINE STILLE BUCHT AM MEER'],['Orte',2,'EIN WALD VOLLER PILZE'],['Orte',2,'DAS KLEINE KAFFEEHAUS AM MARKT'],
['Orte',3,'EIN LEUCHTTURM AN DER NORDSEE'],['Orte',3,'EINE BÄCKEREI HINTER DER KIRCHE'],['Orte',3,'DIE ALTE STADTMAUER IM ABENDLICHT'],['Orte',3,'EIN WASSERFALL MITTEN IM URWALD'],['Orte',3,'EIN SPAZIERGANG DURCH DIE ALTSTADT'],
/* Redewendungen */
['Sprichwörter',1,'DAUMEN DRÜCKEN'],['Sprichwörter',1,'ES GEHT UM DIE WURST'],['Sprichwörter',1,'ALLES IM GRÜNEN BEREICH'],['Sprichwörter',1,'TIEF DURCHATMEN'],['Sprichwörter',1,'MIT DER TÜR INS HAUS FALLEN'],
['Sprichwörter',2,'DER FRÜHE VOGEL FÄNGT DEN WURM'],['Sprichwörter',2,'ÜBUNG MACHT DEN MEISTER'],['Sprichwörter',2,'WER RASTET DER ROSTET'],['Sprichwörter',2,'KEINE REGEL OHNE AUSNAHME'],['Sprichwörter',2,'NACH DEM REGEN SCHEINT DIE SONNE'],
['Sprichwörter',3,'MORGENSTUND HAT GOLD IM MUND'],['Sprichwörter',3,'EIN BILD SAGT MEHR ALS TAUSEND WORTE'],['Sprichwörter',3,'DER APFEL FÄLLT NICHT WEIT VOM STAMM'],['Sprichwörter',3,'KEINE ROSE OHNE DORNEN'],['Sprichwörter',3,'WER ANDEREN EINE GRUBE GRÄBT FÄLLT SELBST HINEIN'],
/* Dinge */
['Dinge',1,'GOLDENER SCHLÜSSEL'],['Dinge',1,'ROTER REGENSCHIRM'],['Dinge',1,'DER STAUBSAUGER'],['Dinge',1,'EINE ARMBANDUHR'],['Dinge',1,'SCHNEEKUGEL'],
['Dinge',2,'EINE TASCHENUHR MIT KETTE'],['Dinge',2,'DIE STANDUHR IM FLUR'],['Dinge',2,'EIN STAPEL STAUBIGER BÜCHER'],['Dinge',2,'EIN FERNGLAS FÜR DIE WANDERUNG'],['Dinge',2,'DICKE WOLLSOCKEN FÜR DEN WINTER'],
['Dinge',3,'EIN GROSSER SPIEGEL MIT GOLDRAHMEN'],['Dinge',3,'DER LEDERSESSEL AM KAMIN'],['Dinge',3,'EINE SPIELUHR DIE EIN WIEGENLIED SPIELT'],['Dinge',3,'EIN ALTER KOMPASS MIT GESPRUNGENEM GLAS'],['Dinge',3,'DER SCHLÜSSEL ZUR KLEINEN DACHBODENTÜR'],
/* Natur */
['Natur',1,'VOLLMOND'],['Natur',1,'MORGENTAU'],['Natur',1,'SOMMERREGEN'],['Natur',1,'WILDBLUMEN'],['Natur',1,'STARKER WIND'],
['Natur',2,'EIN REGENBOGEN NACH DEM GEWITTER'],['Natur',2,'DAS RAUSCHEN DER BLÄTTER'],['Natur',2,'EIN BACH IM TAL'],['Natur',2,'SONNENLICHT DURCH DIE BÄUME'],['Natur',2,'NEBEL ÜBER DEN WIESEN'],
['Natur',3,'EIN GEWITTER ZIEHT ÜBER DIE BERGE'],['Natur',3,'GLÜHWÜRMCHEN TANZEN ÜBER DER WIESE'],['Natur',3,'DIE ERSTEN SCHNEEFLOCKEN DES WINTERS'],['Natur',3,'DIE EBBE ZIEHT LANGSAM ZURÜCK'],['Natur',3,'EIN SEE IM MORGENNEBEL'],
/* Tiere */
['Tiere',1,'SCHLAFENDE KATZE'],['Tiere',1,'KLEINER IGEL'],['Tiere',1,'BUNTER PAPAGEI'],['Tiere',1,'EISBÄR'],['Tiere',1,'FLEISSIGE BIENEN'],
['Tiere',2,'EINE HERDE WILDER PFERDE'],['Tiere',2,'DER FAULE LÖWE AUF DEM FELSEN'],['Tiere',2,'PINGUINE AUF DEM EIS'],['Tiere',2,'EIN FUCHS IM MONDLICHT'],['Tiere',2,'DELFINE SPRINGEN DURCH DIE WELLEN'],
['Tiere',3,'ELEFANTEN ÜBERQUEREN DEN FLUSS'],['Tiere',3,'EIN EICHHÖRNCHEN VERSTECKT NÜSSE'],['Tiere',3,'MÖWEN KREISEN ÜBER DEN FISCHERBOOTEN'],['Tiere',3,'EIN IGEL ROLLT SICH UNTER DER HECKE EIN'],['Tiere',3,'ENTENKÜKEN FOLGEN IHRER MUTTER'],
/* Sport & Spiele */
['Sport & Spiele',1,'TOR DES TAGES'],['Sport & Spiele',1,'GLÜCKSWÜRFEL'],['Sport & Spiele',1,'SCHACHCLUB'],['Sport & Spiele',1,'GOLDMEDAILLE'],['Sport & Spiele',1,'DER SCHLUSSPFIFF'],
['Sport & Spiele',2,'EIN PERFEKTER STRIKE AUF DER KEGELBAHN'],['Sport & Spiele',2,'DIE ZUSCHAUER JUBELN'],['Sport & Spiele',2,'KARTENSPIEL BEI KERZENSCHEIN'],['Sport & Spiele',2,'SLALOM DEN VERSCHNEITEN HANG HINUNTER'],['Sport & Spiele',2,'WIR SPIELEN UM DEN FAMILIENPOKAL'],
['Sport & Spiele',3,'DER AUSSENSEITER GEWINNT IN DER LETZTEN MINUTE'],['Sport & Spiele',3,'EIN PASCH IM RICHTIGEN MOMENT'],['Sport & Spiele',3,'ALLE JUBELN WENN DER LETZTE STEIN FÄLLT'],['Sport & Spiele',3,'EIN SPANNENDES RENNEN IM REGEN'],['Sport & Spiele',3,'DER LÄUFER GEHT IN FÜHRUNG'],
/* Menschen & Berufe */
['Menschen & Berufe',1,'DER FEUERWEHRMANN'],['Menschen & Berufe',1,'FREUNDLICHER BÄCKER'],['Menschen & Berufe',1,'NETTER NACHBAR'],['Menschen & Berufe',1,'KLUGER ERFINDER'],['Menschen & Berufe',1,'WEISER ZAUBERER'],
['Menschen & Berufe',2,'DER SCHLAUE KOMMISSAR'],['Menschen & Berufe',2,'EIN BEGABTER GEIGER'],['Menschen & Berufe',2,'DER BRIEFTRÄGER AUF SEINER RUNDE'],['Menschen & Berufe',2,'EINE GEDULDIGE MATHELEHRERIN'],['Menschen & Berufe',2,'DIE KINDERÄRZTIN'],
['Menschen & Berufe',3,'DER NEUE NACHBAR VON NEBENAN'],['Menschen & Berufe',3,'EINE OMA DIE WUNDERBARE GESCHICHTEN ERZÄHLT'],['Menschen & Berufe',3,'EIN BÄCKER AUS LEIDENSCHAFT'],['Menschen & Berufe',3,'DER GÄRTNER MIT DEM STROHHUT'],['Menschen & Berufe',3,'EIN UHRMACHER DER NIE DIE ZEIT VERLIERT'],
/* Reisen */
['Reisen',1,'FENSTERPLATZ'],['Reisen',1,'NACHTZUG'],['Reisen',1,'GEPACKTER KOFFER'],['Reisen',1,'URLAUBSPLÄNE'],['Reisen',1,'SONNIGER HIMMEL'],
['Reisen',2,'EINSTEIGEN BITTE'],['Reisen',2,'EINE REISE ENTLANG DER KÜSTE'],['Reisen',2,'DIE LETZTE FÄHRE DES TAGES'],['Reisen',2,'EINE POSTKARTE AUS LISSABON'],['Reisen',2,'ZELTEN UNTER DEN STERNEN'],
['Reisen',3,'VERLORENES GEPÄCK AUF DEM WEG ZUR INSEL'],['Reisen',3,'EIN SCHLAFWAGEN DURCH DIE BERGE'],['Reisen',3,'DURCH ENGE GASSEN OHNE EINEN PLAN'],['Reisen',3,'DER UMWEG IST OFT DER SCHÖNSTE WEG'],['Reisen',3,'ANKUNFT IM HOTEL KURZ VOR MITTERNACHT'],
/* Zuhause */
['Zuhause',1,'DIE KUSCHELDECKE'],['Zuhause',1,'DAS FAMILIENESSEN'],['Zuhause',1,'DER GARTENZAUN'],['Zuhause',1,'SONNTAGMORGEN'],['Zuhause',1,'HEISSER KAKAO'],
['Zuhause',2,'EIN WARMES FEUER AN WINTERABENDEN'],['Zuhause',2,'DIE KÜCHE RIECHT NACH FRISCHEM BROT'],['Zuhause',2,'LACHEN AM KÜCHENTISCH'],['Zuhause',2,'BRETTSPIELE AN REGNERISCHEN TAGEN'],['Zuhause',2,'FRISCHE WÄSCHE AUF DEM BETT'],
['Zuhause',3,'EIN FAULER NACHMITTAG MIT TEE UND EINEM GUTEN BUCH'],['Zuhause',3,'ALLE SPIELEN IM WOHNZIMMER'],['Zuhause',3,'DER DUFT VON PFANNKUCHEN ZIEHT DIE TREPPE HINAUF'],['Zuhause',3,'DER WEIHNACHTSBAUM LEUCHTET IN DER ECKE'],['Zuhause',3,'OPA SCHNARCHT IM SESSEL'],
/* Wunder & Wörter */
['Märchen & Fantasie',1,'ZAUBERSPRUCH'],['Märchen & Fantasie',1,'DER BÖSE WOLF'],['Märchen & Fantasie',1,'DRACHEN UND RITTER'],['Märchen & Fantasie',1,'GEHEIMCODE'],['Märchen & Fantasie',1,'DER VERZAUBERTE FROSCH'],
['Märchen & Fantasie',2,'EINE SCHATZKARTE MIT ROTEM KREUZ'],['Märchen & Fantasie',2,'DIE VERLORENE STADT AUS GOLD'],['Märchen & Fantasie',2,'EIN TRANK DER UNSICHTBAR MACHT'],['Märchen & Fantasie',2,'DER TURM DES ZAUBERERS'],['Märchen & Fantasie',2,'EIN SCHIFF IN DER FLASCHE'],
['Märchen & Fantasie',3,'EIN RÄTSEL IN UNSICHTBARER TINTE'],['Märchen & Fantasie',3,'DER VERZAUBERTE WALD AM ENDE DER WELT'],['Märchen & Fantasie',3,'ES WAR EINMAL IN EINEM FERNEN KÖNIGREICH'],['Märchen & Fantasie',3,'DAS GEHEIMNIS DER ALTEN BIBLIOTHEK'],['Märchen & Fantasie',3,'EINE TÜR DIE ZU JEDEM ORT FÜHRT']
];
