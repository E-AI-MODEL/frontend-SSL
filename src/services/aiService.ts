import { GoogleGenAI } from '@google/genai';
import { Seed } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

const SYSTEM_PROMPT = `
Je bent de interactieve "Research Intelligence Layer" voor het Shadow Seed Learning (SSL) 4.5 project. Je fungeert als de super-frontend die complexe JSON-data uit de GitHub-repository vertaalt naar inzichten voor onderzoekers en gebruikers.

**Context & Kennis:**
*   **Kernconcept:** SSL identificeert "structurele afwezigheden" (gaps) in modelantwoorden en slaat deze op als gewichtloze seeds.
*   **Architectuur:** Maak strikt onderscheid tussen \`trace\` (zichtbaarheid, start op 2.0) en \`weight\` (invloed, start op 0.0). Een seed krijgt pas invloed op retrieval of modelantwoorden wanneer de **Validation Gate** vaststelt dat er genoeg bewijs is en geen contradicties zijn.
*   **Status:** We zijn in Phase 3.

**Jouw Taken:**
1.  **Validation Gate Analyse:** Leg het beslissingsproces per seed uit. 
2.  **Paper Pijplijn:** Vergelijk gevonden gaten in academische teksten met bestaande SSL-seeds.
3.  **Dialectische Probes:** Genereer adversarial probes voor gepromoveerde seeds.

**Instructies voor Brongebruik:**
*   Verwijs naar herkomst in manifest.json (provenance-safe). Geef altijd een referentie aan via een "Deep Dive" link, bijvoorbeeld: "(Zie originele Validation-check in stap 03 in manifest)".

**MAPPING LAYER (Indien Eenvoudige Taal is geactiveerd):**
*   Shadow Seed -> Informatie-kiem (of ontdekt kennishiaat)
*   Trace -> Signaalsterkte (hoe vaak ziet de AI dit gat?)
*   Weight -> Vertrouwensscore (hoeveel invloed heeft dit gat?)
*   Validation Gate -> Kwaliteitsbewaker (filtert onzin)
*   Gap Finder -> Puzzelstukjes-zoeker (kijkt wat er mist)
*   Adversarial Evaluation -> Stresstest (probeert iemand de AI te misleiden?)
`;

export const AIService = {
  async analyzeSeed(seed: Seed, humanMode: boolean): Promise<string> {
    const ai = getAI();
    let modeInstruction = "";
    if (humanMode) {
      modeInstruction = `
BELANGRIJK - EENVOUDIGE TAAL MODUS ACTIEF: 
Vertrouwensscore en Signaalsterkte staan centraal. Vat je analyse samen in ongeveer drie zinnen:
1. Wat hebben we ontdekt?
2. Waarom is dit betrouwbaar (of onbetrouwbaar, gebaseerd op signaalsterkte/vertrouwensscore)?
3. Wat betekent dit voor de gebruiker?
Behoud semantische diepgang door een "Deep Dive" link tekst te plaatsen. Gebruik de Mapping Layer termen.`;
    }

    const prompt = `
Analyseer de volgende Seed uit de \`results/latest/summary.json\`:
Concept: ${seed.concept}
Gap: ${seed.gap_description}
Trace: ${seed.trace}
Weight: ${seed.weight}
Status: ${seed.status}
Provenance: ${seed.provenance}

Geef een interpretatie van deze seed volgens de SSL 4.5 architectuur. Waarom is deze status zo bepaald en wat betekent dit voor de Validation Gate?
${modeInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || 'Geen analyse beschikbaar.';
  },

  async generateProbes(seeds: Seed[], humanMode: boolean): Promise<string> {
    const ai = getAI();
    const promotedSeeds = seeds.filter(s => s.status === 'PROMOTED');
    
    if (promotedSeeds.length === 0) {
      return "Geen promoted seeds gevonden om probes uit te genereren.";
    }

    const seedsText = promotedSeeds.map(s => `- ${s.concept}: ${s.gap_description} (Weight: ${s.weight})`).join('\n');

    let modeInstruction = "";
    if (humanMode) {
      modeInstruction = `
BELANGRIJK - EENVOUDIGE TAAL MODUS ACTIEF: 
Druk je uit in de termen van de Mapping Layer (bijv. "Stresstest", "Informatie-kiem"). Vertaal de "run-probe-utility-benchmark" output naar actiegericht advies in menselijke taal, bijvoorbeeld: "De antwoorden van de AI zijn nu getraind op deze lastige vragen."`;
    }

    const prompt = `
Genereer scherpere vervolgvragen (dialectische probes) op basis van deze gepromoveerde seeds uit de benchmark:
${seedsText}

De probes moeten gericht zijn op "adversarial evaluation" om te testen of het gemaakte model dit specifieke gat ook in complexe, misleidende contexten aantoont.
${modeInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || 'Geen probes gegenereerd.';
  },
  
  async analyzePaper(paperText: string, existingSeeds: Seed[], humanMode: boolean): Promise<string> {
    const ai = getAI();
    const seedsText = existingSeeds.map(s => `- ${s.concept}`).join('\n');

    let modeInstruction = "";
    if (humanMode) {
      modeInstruction = `
BELANGRIJK - EENVOUDIGE TAAL MODUS ACTIEF: 
Gebruik de Mapping Layer termen. In plaats van technische afwezigheden te benoemen, geef een lijstje zoals: "Deze belangrijke onderwerpen (kennishiaten) misten in je geüploade documenten." Voeg ook de "Deep Dive" referentie toe.`;
    }

    const prompt = `
Lees de volgende tekst of samenvatting uit een paper.
Tekst:
"${paperText.substring(0, 3000)}"

Vergelijk de mogelijke gaten of "structurele afwezigheden" (gaps) die je in deze tekst kunt identificeren met onze bestaande SSL-seeds:
${seedsText}

Zijn er nieuwe seeds (informatie-kiemen) die we aan het systeem moeten toevoegen? Of sluit deze tekst naadloos aan bij bestaande seeds? Formuleer je oordeel als een 'Research Intelligence' advies.
${modeInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || 'Geen analyse beschikbaar.';
  }
};
