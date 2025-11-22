# Countries and Restrictions Page

## Opis

Ova stranica prikazuje interaktivnu mapu sveta sa zemljama obojenim prema nivou restrikcija. Stranica omogućava korisnicima da:
- Vide vizuelni pregled svih zemalja i njihovih restrikcija
- Kliknu na bilo koju zemlju da vide detaljne informacije o pravilima
- Pregledaju sve scenarije i procedure za rukovanje svakom kategorijom

## Pristup stranici

Stranica je dostupna na URL-u: `http://localhost:3000/countries-restrictions`

## Struktura

### 1. Fajlovi

- **`src/pages/CountriesRestrictions.jsx`** - Glavna stranica sa mapom
- **`src/components/CountryRestrictionModal.jsx`** - Modal za prikaz detalja o zemlji
- **`src/components/RestrictionRulesSection.jsx`** - Sekcija sa pravilima ispod mape
- **`src/data/countryRestrictions.js`** - Konfiguracija sa svim podacima o zemljama

### 2. Kategorije zemalja

#### Dark Red Flag 🟥 (Pastel crvena: #e8b4b8)
Zemlje sa najstrožijim restrikcijama:
- Afghanistan, North Korea, Australia, Côte d'Ivoire, Portugal, Cuba, Serbia, Curaçao, Peru, Democratic Republic of the Congo, South Sudan, Iran, Spain, Iraq, Sudan, Liberia, Syria, Libya, United Kingdom, Netherlands, United States, Italy, Zimbabwe, Colombia, Switzerland, Brazil, Puerto Rico

#### Orange Flag 🟧 (Pastel narandžasta: #ffd4a3)
Zemlje sa srednjim restrikcijama:
- France, Germany, Israel, Malta, Slovakia, Czech Republic, Greece, Lithuania, Cyprus, Poland, Belgium, Denmark, Austria, Argentina, Croatia

#### Yellow Flag 🟨 (Pastel žuta: #fff4a3)
Zemlje sa blagim restrikcijama:
- Sweden

#### Green Flag 🟩 (Pastel zelena: #c8e6c9)
Sve ostale zemlje (bez restrikcija)

### 3. Funkcionalnosti

#### Interaktivna mapa
- **Hover efekt**: Zemlja se malo zatamni kada se prelazi mišem preko nje
- **Zoom**: Moguće je zumirati mapu pomoću točkića miša
- **Pan**: Moguće je pomerati mapu prevlačenjem
- **Klik**: Klik na zemlju otvara modal sa detaljnim pravilima

#### Modal prozor
Kada se klikne na zemlju, otvara se modal koji prikazuje:
- Naziv zemlje
- Kategoriju (Dark Red, Orange, Yellow, Green)
- Sve scenarije za tu kategoriju sa "What to do" i "What NOT to do" uputstvima
- Proces detalje sa važnim napomenama
- Template poruke za support agente
- Lista svih zemalja u istoj kategoriji

#### Sekcija pravila
Ispod mape se nalazi accordion sa svim pravilima:
- Svaka kategorija je expandable/collapsable
- Prikazuje sve zemlje u kategoriji
- Detaljni scenariji sa zelenim (what to do) i crvenim (what not to do) sekcijama
- Process details sa važnim napomenama i koracima

### 4. Boje i stilizacija

Sve boje su pastelne i prilagođene kako bi bile prijatne za oči:
- Dark Red: #e8b4b8 (pastel crveno-pink)
- Orange: #ffd4a3 (pastel narandžasta)
- Yellow: #fff4a3 (pastel žuta)
- Green: #c8e6c9 (pastel zelena)

Hover efekat zatamnjuje boju za 15% (faktor 0.85).

### 5. Dark mode podrška

Stranica podržava dark mode sa automatskim prilagođavanjem:
- Svetle pozadine postaju tamne
- Tekst se automatski prilagođava
- Granice i senke se adaptiraju

## Tehnički detalji

### Biblioteke korišćene
- **react-simple-maps** - Za prikaz interaktivne mape sveta
- **lucide-react** - Za ikonice
- **tailwindcss** - Za stilizaciju

### Komponente

#### CountriesRestrictions.jsx
Glavna komponenta koja:
- Renderuje mapu pomoću react-simple-maps
- Upravlja hover i klik akcijama
- Prikazuje legend i instrukcije za korišćenje
- Poziva modal i rules sekciju

#### CountryRestrictionModal.jsx
Modal komponenta koja:
- Prima podatke o zemlji (ime, ISO kod, nivo restrikcije)
- Prikazuje sve relevantne informacije iz restrictionRules objekta
- Omogućava zatvaranje klikom na dugme ili X

#### RestrictionRulesSection.jsx
Accordion sekcija koja:
- Prikazuje sve kategorije sa bojama
- Omogućava expand/collapse za svaku kategoriju
- Renderuje scenarios, process details, i country lists

## Dodavanje nove zemlje ili izmena kategorije

Da biste dodali novu zemlju ili promenili kategoriju postojeće:

1. Otvorite `src/data/countryRestrictions.js`
2. Dodajte zemlju u odgovarajući array: `darkRedCountries`, `orangeCountries`, ili `yellowCountries`
3. Dodajte mapping u `countryToISO3` objekat (koristite ISO 3166-1 alpha-3 kod)

Primer:
```javascript
export const orangeCountries = [
  'France', 'Germany', 'Israel', 'Malta',
  'NewCountry' // dodajte novu zemlju
];

export const countryToISO3 = {
  // ...
  'NewCountry': 'NCT', // dodajte ISO3 kod
};
```

## Testiranje

Za testiranje stranice:
1. Pokrenite frontend: `npm start` u `frontend` folderu
2. Posetite: `http://localhost:3000/countries-restrictions`
3. Testirajte:
   - Hover na različite zemlje - trebale bi se zatamniti
   - Klik na zemlju - trebao bi se otvoriti modal sa pravilima
   - Scroll za zoom mapu
   - Expand/collapse različite kategorije u rules sekciji
   - Dark mode toggle (ako postoji u aplikaciji)

## Buduća poboljšanja (opciono)

- Dodati search funkcionalnost za brzo pronalaženje zemlje
- Dodati filter za prikaz samo određene kategorije
- Dodati export funkcionalnost za pravila (PDF/CSV)
- Dodati statistiku (broj zemalja po kategoriji, grafikon, itd.)
