import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const TICKETS: Array<{
  studentName: string
  studentEmail: string
  subject: string
  body: string
  status: 'open' | 'resolved' | 'closed'
  category: 'general' | 'technical' | 'refund'
  daysAgo: number
}> = [
  // --- TEHNIČKO ---
  { studentName: 'Nikola Jovanović', studentEmail: 'nikola.jovanovic@uni.edu', subject: 'Ne mogu da se prijavim na studentski portal', body: 'Svaki put kada unesem kredencijale stranica se samo osvežava. Probao sam u Chrome-u i Firefox-u, ali problem se ponavlja.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Milica Petrović', studentEmail: 'milica.petrovic@uni.edu', subject: 'Video predavanja se ne učitavaju na Safariju', body: 'Snimci predavanja beskonačno učitavaju u Safariju 17. U Chrome-u rade, ali preferiram Safari.', status: 'resolved', category: 'technical', daysAgo: 3 },
  { studentName: 'Stefan Nikolić', studentEmail: 'stefan.nikolic@uni.edu', subject: 'Greška pri otpremanju seminarskog rada', body: 'Kada pokušam da otpremim PDF veći od 5 MB stranica izbaci grešku 500. Problem se javlja pri svakom pokušaju.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Jelena Marković', studentEmail: 'jelena.markovic@uni.edu', subject: 'SMS kod za dvofaktorsku autentifikaciju ne stiže', body: 'Podesila sam 2FA prošle nedelje ali SMS kodovi su prestali da stižu nakon što sam promenila broj telefona.', status: 'open', category: 'technical', daysAgo: 0 },
  { studentName: 'Marko Popović', studentEmail: 'marko.popovic@uni.edu', subject: 'Odgovori na forumu nestaju', body: 'Objavio sam odgovor na forumu za 4. nedelju, nakratko se pojavio pa nestao. Dogodilo se tri puta zaredom.', status: 'resolved', category: 'technical', daysAgo: 5 },
  { studentName: 'Tamara Ilić', studentEmail: 'tamara.ilic@uni.edu', subject: 'E-indeks prikazuje pogrešnu ocenu sa kolokvijuma', body: 'Na e-indeksu mi piše 54/100, a na radu koji sam dobila nazad stoji 74/100. Molim proveru.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Aleksa Đorđević', studentEmail: 'aleksa.djordjevic@uni.edu', subject: 'Mobilna aplikacija se zamrzava pri predaji testa', body: 'iOS aplikacija se zamrzava oko 30 sekundi pri predaji vremenski ograničenog testa, a zatim ga označi kao zakašnjeli.', status: 'open', category: 'technical', daysAgo: 4 },
  { studentName: 'Dragana Stanković', studentEmail: 'dragana.stankovic@uni.edu', subject: 'Email obaveštenja su prestala da rade', body: 'Dobijala sam mejlove za nova postavljanja zadataka, ali to je prestalo pre oko 10 dana bez ikakvog razloga.', status: 'closed', category: 'technical', daysAgo: 10 },
  { studentName: 'Jovan Stojanović', studentEmail: 'jovan.stojanovic@uni.edu', subject: 'Veb-kamera nije prepoznata tokom nadziranog ispita', body: 'Program za nadzor ispita ne prepoznaje moju veb-kameru, iako ona radi bez problema u Zoom-u.', status: 'open', category: 'technical', daysAgo: 0 },
  { studentName: 'Ana Milosavljević', studentEmail: 'ana.milosavljevic@uni.edu', subject: 'PDF materijali se ne preuzimaju', body: 'Klikom na "Preuzmi" kod materijala kursa otvori se samo prazan tab. Fajl se ne čuva na računaru.', status: 'resolved', category: 'technical', daysAgo: 7 },
  { studentName: 'Miloš Lazović', studentEmail: 'milos.lazovic@uni.edu', subject: 'Traka napretka ostaje na 0% za završene module', body: 'Završio sam sva četiri modula iz 2. nedelje, ali traka napretka i dalje pokazuje 0%. Brinem da će to uticati na ocenu.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Jovana Savić', studentEmail: 'jovana.savic@uni.edu', subject: 'Link za pristup online predavanju ne radi', body: 'Dugme "Pridruži se predavanju" vraća grešku 404. Čas počinje za dva sata, hitno je.', status: 'resolved', category: 'technical', daysAgo: 6 },
  { studentName: 'Petar Kovačević', studentEmail: 'petar.kovacevic@uni.edu', subject: 'Čitač ekrana ne radi sa interfejsom za testove', body: 'Koristim NVDA za pristupačnost. Opcije odgovora na testu uopšte ne čita čitač ekrana.', status: 'open', category: 'technical', daysAgo: 3 },
  { studentName: 'Milena Todorović', studentEmail: 'milena.todorovic@uni.edu', subject: 'SSO prijava vodi na stranicu greške', body: 'Kada kliknem na SSO prijavu iz portala biblioteke, dobijem stranicu "Neovlašćen pristup".', status: 'closed', category: 'technical', daysAgo: 14 },
  { studentName: 'Luka Simić', studentEmail: 'luka.simic@uni.edu', subject: 'Rubrika nije vidljiva posle predaje rada', body: 'Rubrika koju sam mogao da vidim pre predaje sada je sakrivena. Potrebna mi je da bih razumeo ocenu.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Nevena Živković', studentEmail: 'nevena.zivkovic@uni.edu', subject: 'Audio i slajdovi nisu sinhronizovani', body: 'Treće predavanje od prošlog utorka ima audio koji kasni oko 4 sekunde za slajdovima.', status: 'resolved', category: 'technical', daysAgo: 8 },
  { studentName: 'Ivan Stefanović', studentEmail: 'ivan.stefanovic@uni.edu', subject: 'Link za resetovanje lozinke je odmah istekao', body: 'U mejlu za resetovanje lozinke piše da link važi 24 sata, ali čim kliknem kaže da je istekao.', status: 'open', category: 'technical', daysAgo: 0 },
  { studentName: 'Vesna Đurić', studentEmail: 'vesna.djuric@uni.edu', subject: 'Zajednički dokument se ne sinhronizuje', body: 'Moj kolega iz grupe i ja radimo na zajedničkom dokumentu, ali izmene s jedne strane se ne vide na drugoj strani.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Nemanja Vasić', studentEmail: 'nemanja.vasic@uni.edu', subject: 'Pogrešna vremenska zona za rok predaje testa', body: 'Test je trebalo da se zatvori u 23h, ali zatvorio se u 20h po mom vremenu. Mislim da portal koristi pogrešnu vremensku zonu.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Sofija Pavlović', studentEmail: 'sofija.pavlovic@uni.edu', subject: 'Pretraga biblioteke ne daje rezultate', body: 'Pretraga po bilo kojoj ključnoj reči u biblioteci kurseva vraća "0 rezultata" čak i za najobičnije pojmove.', status: 'resolved', category: 'technical', daysAgo: 9 },
  { studentName: 'Bojan Milošević', studentEmail: 'bojan.milosevic@uni.edu', subject: 'Sistem za rezervaciju tutora ne pokazuje slobodne termine', body: 'Portal za zakazivanje tutorstva ne prikazuje slobodne termine ni za jedan predmet u naredne tri nedelje.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Teodora Radović', studentEmail: 'teodora.radovic@uni.edu', subject: 'Pristup sportskim objektima blokiran posle uplate školarine', body: 'Prošle nedelje sam u potpunosti platila školarinu, ali studentska kartica se i dalje odbija na sportskim objektima.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Filip Filipović', studentEmail: 'filip.filipovic@uni.edu', subject: 'Otpremanje master rada ne uspeva pri 99%', body: 'Tri puta sam pokušao da otpremim PDF master rada od 80 MB. Svaki put se zaustavi na 99% i javi grešku mreže.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Dunja Antić', studentEmail: 'dunja.antic@uni.edu', subject: 'Vifi u studentskom domu — stalno pada konekcija', body: 'Bežična mreža u bloku C gubi vezu svakih 15–20 minuta, što mi izuzetno otežava pohađanje online časova.', status: 'open', category: 'technical', daysAgo: 3 },
  { studentName: 'Đorđe Bogdanović', studentEmail: 'djordje.bogdanovic@uni.edu', subject: 'Kliker uređaj se ne registruje na predavanju', body: 'Kupio sam obavezni iClicker uređaj, ali tabla nastavnika nikada ne prikazuje moje odgovore tokom časa.', status: 'open', category: 'technical', daysAgo: 5 },
  // --- POVRAĆAJ SREDSTAVA ---
  { studentName: 'Katarina Damnjanović', studentEmail: 'katarina.damnjanov@uni.edu', subject: 'Zahtev za povraćaj školarine — odjava pre roka', body: 'Odjavila sam se sa predmeta Hemija 201 tri dana pre krajnjeg roka. Prema pravilniku imam pravo na povraćaj od 45.000 din.', status: 'open', category: 'refund', daysAgo: 5 },
  { studentName: 'Vladimir Erić', studentEmail: 'vladimir.eric@uni.edu', subject: 'Duplo zaduženje na računu ovog semestra', body: 'Izvod računa pokazuje dva identična zaduženja od po 120.000 din na datum 15. januara. Molim istragu i povraćaj jednog iznosa.', status: 'resolved', category: 'refund', daysAgo: 30 },
  { studentName: 'Sandra Gavrilović', studentEmail: 'sandra.gavrilovic@uni.edu', subject: 'Povraćaj za parking dozvolu posle prodaje automobila', body: 'Prošlog meseca sam prodala automobil i više mi ne treba parking dozvola za koju sam platila. Tražim srazmerni povraćaj.', status: 'open', category: 'refund', daysAgo: 4 },
  { studentName: 'Srđan Hadžić', studentEmail: 'srdjan.hadzic@uni.edu', subject: 'Predmet otkazan — status povraćaja?', body: 'Istorija 310 je otkazana dve nedelje nakon početka semestra. Rečeno mi je da će biti izvršen povraćaj, ali ga nisam dobio posle tri nedelje.', status: 'open', category: 'refund', daysAgo: 3 },
  { studentName: 'Maja Ivanović', studentEmail: 'maja.ivanovic@uni.edu', subject: 'Povraćaj zdravstvenog osiguranja nije isplaćen', body: 'U avgustu sam podnela odricanje od zdravstvenog osiguranja i ono je odobreno. Povraćaj od 38.000 din nije stigao ni posle 6 nedelja.', status: 'closed', category: 'refund', daysAgo: 45 },
  { studentName: 'Dejan Janković', studentEmail: 'dejan.jankovic@uni.edu', subject: 'Preplata na rate školarine', body: 'Slučajno sam uplatio pun iznos školarine uz ratu, što je rezultovalo prplatom od 60.000 din. Molim povraćaj razlike.', status: 'resolved', category: 'refund', daysAgo: 12 },
  { studentName: 'Tijana Karić', studentEmail: 'tijana.karic@uni.edu', subject: 'Povraćaj naknade za tehnologiju — student na daljinu', body: 'Studiram isključivo online i živim van Srbije, a naplaćena mi je naknada za kampus tehnologiju od 15.000 din. Tražim povraćaj.', status: 'open', category: 'refund', daysAgo: 6 },
  { studentName: 'Branko Lukić', studentEmail: 'branko.lukic@uni.edu', subject: 'Stipendija premašuje školarinu — rok za povraćaj?', body: 'Moja stipendija je veća od iznosa školarine za 80.000 din. Studentska služba je rekla da će poslati ček, ali ga nisam dobio.', status: 'open', category: 'refund', daysAgo: 2 },
  { studentName: 'Ivana Matić', studentEmail: 'ivana.matic@uni.edu', subject: 'Laboratorijska naknada naplaćena greškom', body: 'Naplaćena mi je laboratorijska naknada za Hemiju 101 u iznosu od 12.000 din, ali sam upisana u sekciju sa predavanjima bez prakse.', status: 'resolved', category: 'refund', daysAgo: 18 },
  { studentName: 'Zoran Nešić', studentEmail: 'zoran.nesic@uni.edu', subject: 'Povraćaj za zakašnjelu kaznu u biblioteci', body: 'Portal je prikazivao rok za vraćanje knjige 15. maja, a naplaćena mi je kazna za kašnjenje. Imam snimak ekrana sa originalnim rokom.', status: 'open', category: 'refund', daysAgo: 7 },
  { studentName: 'Andrijana Obradović', studentEmail: 'andrijana.obrad@uni.edu', subject: 'Medicinska odjava — zahtev za povraćaj školarine', body: 'Podnela sam medicinsku dokumentaciju za potpunu odjavu zbog operacije. Tražim povraćaj školarine u skladu sa pravilnikom.', status: 'open', category: 'refund', daysAgo: 1 },
  { studentName: 'Danijela Pejović', studentEmail: 'danijela.pejovic@uni.edu', subject: 'Dupla uplata pri prijavi za studentski dom', body: 'Portal studentskog doma je imao grešku i moja kartica je dva puta zadužena za po 30.000 din. Molim povraćaj jednog iznosa.', status: 'resolved', category: 'refund', daysAgo: 20 },
  { studentName: 'Emilija Ranković', studentEmail: 'emilija.rankovic@uni.edu', subject: 'Naknada studentskog saveza — pohađam online', body: 'Ovaj semestar sam isključivo online student, a naplaćena mi je obavezna naknada studentskog saveza. Molim razmatranje povraćaja.', status: 'open', category: 'refund', daysAgo: 8 },
  { studentName: 'Ognjen Stojković', studentEmail: 'ognjen.stojkovic@uni.edu', subject: 'Povraćaj za prebukirani letnji kurs', body: 'Uklonjen sam sa Psihologije 220 jer je kurs bio prebukiran. Platio sam depozit, ali povraćaj nije stigao.', status: 'open', category: 'refund', daysAgo: 4 },
  { studentName: 'Mirjana Tošić', studentEmail: 'mirjana.tosic@uni.edu', subject: 'Povraćaj neiskorišćenog salda kartice za obroke', body: 'Na kraju semestra mi ostaje 21.000 din na kartici za obroke. Da li je moguće dobiti povraćaj ostatka?', status: 'closed', category: 'refund', daysAgo: 25 },
  { studentName: 'Rastko Urošević', studentEmail: 'rastko.urosevic@uni.edu', subject: 'Naplaćena naknada za laboratoriju za otkazane vežbe', body: 'Biološke laboratorijske vežbe su otkazane u poslednjem mesecu semestra. Platio sam 7.500 din za opremu i tražim srazmerni povraćaj.', status: 'open', category: 'refund', daysAgo: 2 },
  { studentName: 'Nikoleta Vučić', studentEmail: 'nikoleta.vucic@uni.edu', subject: 'Naplaćena pogrešna naknada za strane studente', body: 'Imam stalno nastanjenje i trebalo bi da plaćam školarinu kao domaći student. Na fakturi je naknada za strance od 940.000 din.', status: 'open', category: 'refund', daysAgo: 3 },
  { studentName: 'Stevan Zečević', studentEmail: 'stevan.zecevic@uni.edu', subject: 'Povraćaj za duplu kaznu u biblioteci', body: 'Kaznu od 1.500 din sam platio online, a zatim i na šalteru jer sistem nije ažurirao status na vreme. Tražim povraćaj jedne uplate.', status: 'resolved', category: 'refund', daysAgo: 8 },
  // --- OPŠTE ---
  { studentName: 'Biljana Aleksić', studentEmail: 'biljana.aleksic@uni.edu', subject: 'Zahtev za produženje roka — porodična hitnost', body: 'Prošle nedelje mi je preminula baka i nisam bila u stanju da završim zadatak za 5. nedelju. Molim produženje od jedne nedelje.', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Mladen Babić', studentEmail: 'mladen.babic@uni.edu', subject: 'Potrebna potvrda o upisu', body: 'Potrebna mi je zvanična potvrda o upisu za poslodavca. Da li može da mi bude poslata mejlom u PDF formatu?', status: 'resolved', category: 'general', daysAgo: 11 },
  { studentName: 'Snežana Cvijović', studentEmail: 'snezana.cvijovic@uni.edu', subject: 'Pitanje o kasnom odjavljivanju sa predmeta', body: 'Razmišljam da se odjavim sa Ekonomije 302, ali smo prošli standardni rok. Koje su moje opcije?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Uroš Despotović', studentEmail: 'uros.despotovic@uni.edu', subject: 'Promena prezimena na studentskoj kartici i indeksu', body: 'Prošlog meseca sam zakonski promenio prezime. Kako da ažuriram podatke na studentskoj kartici, portalu i zvaničnom indeksu?', status: 'open', category: 'general', daysAgo: 6 },
  { studentName: 'Zorana Filipović', studentEmail: 'zorana.filipovic@uni.edu', subject: 'Pismo o pristupačnosti nije dostavljeno profesoru', body: 'Služba za studente sa invaliditetom je odobrila moje pravo pre dve nedelje, ali profesor na Matematici 211 tvrdi da nije dobio pismo.', status: 'resolved', category: 'general', daysAgo: 14 },
  { studentName: 'Gordana Gajić', studentEmail: 'gordana.gajic@uni.edu', subject: 'Zahtev za prepis ocena za upis na master studije', body: 'Potreban mi je zvanični prepis ocena koji treba poslati na tri fakulteta do 30. novembra. Kako da naručim?', status: 'closed', category: 'general', daysAgo: 60 },
  { studentName: 'Matija Jevtić', studentEmail: 'matija.jevtic@uni.edu', subject: 'Zahtev za izuzeće od preduslova za upis predmeta', body: 'Imam radno iskustvo ekvivalentno preduslovu za Računarstvo 301. Da li mogu da zatražim izuzeće i direktno se upišem?', status: 'open', category: 'general', daysAgo: 5 },
  { studentName: 'Jasna Knežević', studentEmail: 'jasna.knezevic@uni.edu', subject: 'Greška u evidenciji — pogrešan smer', body: 'U studentskom dosijeu i dalje piše "Neopredeljen" iako sam prijavila smer Informatika u septembru.', status: 'resolved', category: 'general', daysAgo: 22 },
  { studentName: 'Andrej Lazarević', studentEmail: 'andrej.lazarevic@uni.edu', subject: 'Zahtev za ocenu "nepotpuno" na Srpskom jeziku 101', body: 'Zbog dokumentovane bolesti nisam mogla da završim završni projekat. Tražim ocenu "nepotpuno" u skladu sa pravilnikom.', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Irena Marinković', studentEmail: 'irena.marinkovic@uni.edu', subject: 'Da li mogu da slušam predmet kao slobodan slušalac?', body: 'Zanima me da li mogu da prisustvujem predavanjima iz Umetnosti 150 ovog semestra bez formalnog upisa.', status: 'resolved', category: 'general', daysAgo: 9 },
  { studentName: 'Rade Milić', studentEmail: 'rade.milic@uni.edu', subject: 'Rok za prijavu za diplomiranje — da li sam zakasnio?', body: 'Mislim da sam propustio rok za prijavu za prolećnu svečanost dodele diploma. Postoji li opcija za kasnu prijavu?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Svetlana Nićiforović', studentEmail: 'svetlana.nicifor@uni.edu', subject: 'Prenos kredita sa partnerskog univerziteta', body: 'Prošle godine sam završila dva predmeta na partnerskom univerzitetu u Beču. Kako da ih priznam za kredite na svom studijskom programu?', status: 'closed', category: 'general', daysAgo: 40 },
  { studentName: 'Vanja Nikolajević', studentEmail: 'vanja.nikolajevic@uni.edu', subject: 'Mentor nije stupio u kontakt', body: 'Dodeljen mi je mentor iz katedre u prvoj nedelji, ali nisam dobila nikakvu poruku. Mogu li da dobijem drugog mentora?', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Tatjana Obrenović', studentEmail: 'tatjana.obrenovic@uni.edu', subject: 'Zahtev za prekoračenje broja ispita u semestru', body: 'Imam prosek 9.5 i htela bih da prijavim više od maksimalnog broja ispita ovog semestra. Ko odobrava takve zahteve?', status: 'resolved', category: 'general', daysAgo: 16 },
  { studentName: 'Aleksandar Pantić', studentEmail: 'aleksandar.pantic@uni.edu', subject: 'Pomoć pri registraciji prakse za akademske kredite', body: 'Pronašao sam praksu za sledeći semestar i hteo bih da je registrujem za akademske kredite. Koji obrasci su potrebni?', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Milanka Pešić', studentEmail: 'milanka.pesic@uni.edu', subject: 'Komentar u vezi sa padom interneta na kampusu', body: 'Internet na kampusu nije radio šest sati u četvrtak, što mi je onemogućilo predaju zadatka na vreme. Htela bih to da prijavim zvanično.', status: 'closed', category: 'general', daysAgo: 7 },
  { studentName: 'Mihailo Radojičić', studentEmail: 'mihailo.radojicic@uni.edu', subject: 'Zahtev za povećanje limita pozajmice u biblioteci', body: 'Pišem doktorsku disertaciju i potrebno mi je da pozajmim više od standardnih 10 knjiga. Postoji li mogućnost povećanja limita?', status: 'resolved', category: 'general', daysAgo: 19 },
  { studentName: 'Milanka Ristić', studentEmail: 'milanka.ristic@uni.edu', subject: 'Potrebna potvrda o akademskom uspehu', body: 'Potrebna mi je potvrda da se nalazim u akademskom regularnom statusu za stipendiju čiji je rok naredne nedelje.', status: 'open', category: 'general', daysAgo: 0 },
  { studentName: 'Nemanja Savković', studentEmail: 'nemanja.savkovic@uni.edu', subject: 'Sukob u rasporedu — dva obavezna predmeta se preklapaju', body: 'Sociologija 301 i Psihologija 302 su oba obavezna za moj smer, ali oba se odvijaju utorkom u isto vreme. Kako da rešim ovo?', status: 'open', category: 'general', daysAgo: 5 },
  { studentName: 'Dragica Simić', studentEmail: 'dragica.simic@uni.edu', subject: 'Pitanje o studiranju uz rad', body: 'Imam 29 godina i nemam tradicionalne uslove za upis. Čitala sam o statusu vanrednog studenta — možete li me uputiti?', status: 'resolved', category: 'general', daysAgo: 33 },
  { studentName: 'Slobodan Stanojević', studentEmail: 'slobodan.stanojev@uni.edu', subject: 'Strani student — pitanje o radnoj dozvoli', body: 'Boravišna dozvola mi je na obnovi. Da li smem da radim tokom perioda obnove dok čekam novu dozvolu?', status: 'open', category: 'general', daysAgo: 6 },
  { studentName: 'Zorica Tanasijević', studentEmail: 'zorica.tanasijevic@uni.edu', subject: 'Nedostaje ocena sa završnog ispita', body: 'Ocene za ispitni rok su objavljene juče, ali moja ocena sa završnog ispita iz Računovodstva 301 nedostaje.', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Vladan Tošković', studentEmail: 'vladan.toskovic@uni.edu', subject: 'Unakrsna registracija na partnerskom fakultetu', body: 'Želim da upišem predmet na drugom fakultetu u okviru sporazuma o unakrsnoj registraciji. Koji je rok za prijavu?', status: 'resolved', category: 'general', daysAgo: 28 },
  { studentName: 'Aleksandra Ugrinović', studentEmail: 'aleksandra.ugrin@uni.edu', subject: 'Ažuriranje kontakta za hitne slučajeve', body: 'Moram da ažuriram kontakt za hitne slučajeve u studentskom dosijeu. Ne nalazim gde to da uradim u podešavanjima portala.', status: 'resolved', category: 'general', daysAgo: 15 },
  { studentName: 'Radovan Vasiljević', studentEmail: 'radovan.vasil@uni.edu', subject: 'Primedba na tačnost sadržaja kursa', body: 'Nekoliko tvrdnji u slajdovima za Istoriju 215 deluju netačno. Imam izvore. Kome treba da se obratim?', status: 'open', category: 'general', daysAgo: 8 },
  { studentName: 'Saša Vidović', studentEmail: 'sasa.vidovic@uni.edu', subject: 'Prijava za listu čekanja za studentski dom', body: 'Dom je bio popunjen kada sam se prijavio. Kako da se stavim na listu čekanja i koliko obično treba da se čeka?', status: 'closed', category: 'general', daysAgo: 50 },
  { studentName: 'Gordana Vuković', studentEmail: 'gordana.vukovic@uni.edu', subject: 'Verifikacija volonterskih sati za praksu', body: 'Prošlog semestra sam odradila 120 sati volontiranja u lokalnoj organizaciji. Potrebna mi je verifikacija za praksu.', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Mihajlo Živković', studentEmail: 'mihajlo.zivkovic@uni.edu', subject: 'Odobrenje produženja u ispitnoj nedelji', body: 'Imam medicinski zahvat zakazan tokom ispitne nedelje i brinem da ću propustiti datum vraćanja. Ko može da odobri produženje?', status: 'resolved', category: 'general', daysAgo: 23 },
  { studentName: 'Dušan Bogosavljević', studentEmail: 'dusan.bogosavelj@uni.edu', subject: 'Zabuna oko načina izračunavanja proseka ocena', body: 'Moj prepis pokazuje prosek 8.2, ali kada ručno izračunam po objavljenoj formuli dobijam 8.7. Može li neko da objasni razliku?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Miroslav Bogović', studentEmail: 'miroslav.bogovic@uni.edu', subject: 'Potvrda upisa za studentski bankovni račun', body: 'Banka zahteva aktuelnu potvrdu o upisu za aktivaciju studentskog računa. Da li može da se generiše sa portala?', status: 'resolved', category: 'general', daysAgo: 10 },
  { studentName: 'Nataša Brković', studentEmail: 'natasa.brkovic@uni.edu', subject: 'Rok za prijavu za studentsku razmenu', body: 'Zanima me program razmene sa Univerzitetom u Beču za sledeću jesen. Koji je rok za prijavu?', status: 'open', category: 'general', daysAgo: 5 },
  { studentName: 'Igor Cvetković', studentEmail: 'igor.cvetkovic@uni.edu', subject: 'Služba za studente sa invaliditetom — nova dokumentacija', body: 'Pre dve nedelje sam dostavio novu dokumentaciju za teškoće u učenju, ali nisam dobio odgovor od službe.', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Mina Đaković', studentEmail: 'mina.djakovic@uni.edu', subject: 'Pitanje o postupku za odgođeni ispit', body: 'Bila sam bolesna na dan kolokvijuma i nisam mogla da dođem. Kako da podnesem zahtev za odgođeno polaganje?', status: 'resolved', category: 'general', daysAgo: 17 },
  { studentName: 'Dragan Eraković', studentEmail: 'dragan.erakovic@uni.edu', subject: 'Primedba na buku u biblioteci', body: 'Mesta za grupni rad u blizini ulaza su izuzetno bučna. Da li bi se moglo strože poštovati vreme tišine?', status: 'closed', category: 'general', daysAgo: 35 },
  { studentName: 'Marija Grbić', studentEmail: 'marija.grbic@uni.edu', subject: 'Zahtev za odloženi početak studija', body: 'Primljena sam za upis u septembru, ali moram da odložim početak do januara zbog kašnjenja u procesuiranju vize. Da li je to moguće?', status: 'open', category: 'general', daysAgo: 9 },
  { studentName: 'Vojislav Ilić', studentEmail: 'vojislav.ilic@uni.edu', subject: 'Materijali predavanja nisu postavljeni na portal', body: 'Slajdovi za 3. nedelju na predmetu Menadžment 210 nisu postavljeni, a predavanje je bilo pre četiri dana. Ostali studenti takođe čekaju.', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Nenad Janjić', studentEmail: 'nenad.janjic@uni.edu', subject: 'Zahtev za vrednovanje prethodnog radnog iskustva', body: 'Imam pet godina profesionalnog iskustva u analizi podataka i hteo bih da zatražim vrednovanje za predmet Podaci 101.', status: 'resolved', category: 'general', daysAgo: 26 },
  { studentName: 'Jelica Jevđević', studentEmail: 'jelica.jevdjevic@uni.edu', subject: 'Mesečna karta za autobus nije aktivirana', body: 'Kupila sam semestarsku bus kartu pre dve nedelje, ali u aplikaciji prevoznika i dalje piše da je neaktivna. Plaćam punu cenu.', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Borka Knežević', studentEmail: 'borka.knezevic@uni.edu', subject: 'Pitanje o ponovnom upisu položenog predmeta radi popravke ocene', body: 'Položio sam Francuski 101 prošlog semestra sa ocenom 6. Da li mogu da ga ponovo upišem radi popravke i da li će stara ocena biti zamenjena?', status: 'resolved', category: 'general', daysAgo: 13 },
  { studentName: 'Ljiljana Lazić', studentEmail: 'ljiljana.lazic@uni.edu', subject: 'Prelaz sa redovnih na vanredne studije', body: 'Dobila sam ponudu za stalni posao i htela bih da pređem na vanredno studiranje od sledećeg semestra. Kako to funkcioniše?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Nebojša Milovanović', studentEmail: 'nebojsa.milovan@uni.edu', subject: 'Zahtev za žalbu na ocenu', body: 'Smatram da je moja završna ocena na predmetu Statistika 302 pogrešno izračunata. Gde mogu da pronađem obrazac za žalbu?', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Radmila Mitić', studentEmail: 'radmila.mitic@uni.edu', subject: 'Odustajanje od sportske stipendije zbog povrede', body: 'Dodeljena mi je sportska stipendija uz uslov od 10 sati nedeljno. Zbog povrede moram da se povučem iz te obaveze.', status: 'resolved', category: 'general', daysAgo: 29 },
  { studentName: 'Predrag Nedić', studentEmail: 'predrag.nedic@uni.edu', subject: 'Strani student — pitanje o zdravstvenom osiguranju', body: 'Kartica zdravstvenog osiguranja nije stigla, a imam termin kod lekara naredne nedelje. Kako da dobijem dokaz o pokrivenosti?', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Slavica Nikolić', studentEmail: 'slavica.nikolic@uni.edu', subject: 'Sukob termina završnih ispita', body: 'Dva moja završna ispita zakazana su u tačno isto vreme 14. decembra. Kako se ovo rešava?', status: 'open', category: 'general', daysAgo: 0 },
  { studentName: 'Tomislav Novaković', studentEmail: 'tomislav.novakovic@uni.edu', subject: 'Zahtev za počasno zvanje uz visoke ocene', body: 'Moj prosek ispunjava uslov za počasno zvanje. Kada i kako mogu da podnesem zahtev za nominaciju?', status: 'resolved', category: 'general', daysAgo: 18 },
  { studentName: 'Vesna Obrenović', studentEmail: 'vesna.obrenovic@uni.edu', subject: 'Sistem za prijavu plagijarizma — pogrešno pozitivan nalaz', body: 'Moj esej iz Srpskog književnosti dobio je 42% podudarnost. Označeni delovi su ispravno citirani navodi. Kako da žalbim?', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Zoran Pavić', studentEmail: 'zoran.pavic@uni.edu', subject: 'Program pozajmice laptopova — status prijave', body: 'Pre tri nedelje sam podneo prijavu za laptopove iz programa za socijalno ugrožene. Da li ima načina da proverim status prijave?', status: 'resolved', category: 'general', daysAgo: 21 },
  { studentName: 'Silvana Petrović', studentEmail: 'silvana.petrovic@uni.edu', subject: 'Zahtev za privatnu salu za pisanje ispita', body: 'Imam anksiozni poremećaj i teško mi je u velikim salama. Mogu li da tražim polaganje ispita u manjoj, mirnoj prostoriji?', status: 'open', category: 'general', daysAgo: 6 },
  { studentName: 'Predrag Rakić', studentEmail: 'predrag.rakic@uni.edu', subject: 'Greška u zvaničnom prepisu — nedostaje predmet', body: 'Filozofija 200 se ne pojavljuje na mom zvaničnom prepisu ocena, iako sam položio 2023. godine i prikazuje se u internoj evidenciji.', status: 'open', category: 'general', daysAgo: 0 },
  { studentName: 'Nikolina Srdić', studentEmail: 'nikolina.srdic@uni.edu', subject: 'Zahtev za odlaganje početka prakse', body: 'Dobio sam poziciju za praksu ali moram da odložim početak za dve nedelje zbog porodičnih obaveza. Da li je to dozvoljeno?', status: 'resolved', category: 'general', daysAgo: 24 },
  { studentName: 'Bojana Subotić', studentEmail: 'bojana.subotic@uni.edu', subject: 'Smeštaj u domu — dijetetski zahtevi nisu ispoštovani', body: 'Prijavila sam ozbiljnu alergiju na orašaste plodove studentskim službama, ali osoblje u menzи nije upoznato sa mojim dosijеom.', status: 'open', category: 'general', daysAgo: 2 },
]

async function main() {
  console.log('Seeding 100 tickets…')
  const now = new Date()

  for (const t of TICKETS) {
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - t.daysAgo)
    createdAt.setHours(Math.floor(Math.random() * 12) + 8)
    createdAt.setMinutes(Math.floor(Math.random() * 60))

    await prisma.ticket.create({
      data: {
        studentEmail: t.studentEmail,
        studentName: t.studentName,
        subject: t.subject,
        body: t.body,
        status: t.status,
        category: t.category,
        createdAt,
        updatedAt: createdAt,
        messages: {
          create: {
            body: t.body,
            sender: 'student',
            createdAt,
          },
        },
      },
    })
    process.stdout.write('.')
  }

  console.log(`\nDone — ${TICKETS.length} tickets created.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
