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
Je bent de interactieve "Research Intelligence Layer" voor het Shadow Seed Learning (SSL) 4.5 project. Je fungeert als de super-frontend die complexe JSON-data uit de GitHub-repository vertaalt naar begrijpelijke inzichten voor onderzoekers.

**Context & Kennis:**
*   **Kernconcept:** SSL identificeert "structurele afwezigheden" (gaps) in modelantwoorden en slaat deze op als gewichtloze seeds.
*   **Architectuur:** Maak strikt onderscheid tussen \`trace\` (zichtbaarheid, start op 2.0) en \`weight\` (invloed, start op 0.0). Een seed krijgt pas invloed op retrieval of modelantwoorden wanneer de **Validation Gate** vaststelt dat er genoeg bewijs is en geen contradicties zijn.
*   **Status:** De huidige standaardruns zijn een regressielaag. We zijn in Phase 3.

**Jouw Taken:**
1.  **Validation Gate Analyse:** Leg het beslissingsproces van de Validation Gate per seed uit. Maak onderscheid tussen:
    - *Geweigerde seeds*: weight bleef laag/nul door contradicties of gebrek aan bewijs.
    - *Gepromoveerde seeds*: status PROMOTED, weight hoog genoeg na validatie.
    Toon de dynamiek tussen trace en weight: benadruk dat een hoge trace zonder weight geen invloed heeft.
2.  **Paper Pijplijn:** Gebruik de 'paper pipeline' logica om structurele afwezigheden uit documenten te extraheren en te vergelijken met bestaande seeds. Leg specifiek uit of een gevonden gat al een actieve trace heeft in de database.
3.  **Dialectische Probes:** Genereer adversarial probes voor gepromoveerde seeds.

**Instructies voor Brongebruik:**
*   Verwijs naar herkomst in manifest.json (provenance-safe).
*   Gegarandeerde data-integriteit: presenteer output via "publish guardrails".
`;

export const AIService = {
  async analyzeSeed(seed: Seed): Promise<string> {
    const ai = getAI();
    const prompt = `
Analyseer de volgende Seed uit de \`results/latest/summary.json\`:
Concept: ${seed.concept}
Gap: ${seed.gap_description}
Trace: ${seed.trace}
Weight: ${seed.weight}
Status: ${seed.status}
Provenance: ${seed.provenance}

Geef een interpretatie van deze seed volgens de SSL 4.5 architectuur. Waarom is deze status zo bepaald en wat betekent dit voor de Validation Gate?`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || 'Geen analyse beschikbaar.';
  },

  async generateProbes(seeds: Seed[]): Promise<string> {
    const ai = getAI();
    const promotedSeeds = seeds.filter(s => s.status === 'PROMOTED');
    
    if (promotedSeeds.length === 0) {
      return "Geen promoted seeds gevonden om probes uit te genereren.";
    }

    const seedsText = promotedSeeds.map(s => `- ${s.concept}: ${s.gap_description} (Weight: ${s.weight})`).join('\n');

    const prompt = `
Genereer scherpere vervolgvragen (dialectische probes) op basis van deze gepromoveerde seeds uit de benchmark:
${seedsText}

De probes moeten gericht zijn op "adversarial evaluation" om te testen of het gemaakte model dit specifieke gat ook in complexe, misleidende contexten aantoont.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || 'Geen probes gegenereerd.';
  },
  
  async analyzePaper(paperText: string, existingSeeds: Seed[]): Promise<string> {
    const ai = getAI();
    const seedsText = existingSeeds.map(s => `- ${s.concept}`).join('\n');

    const prompt = `
Lees de volgende tekst of samenvatting uit een paper.
Tekst:
"${paperText.substring(0, 3000)}"

Vergelijk de mogelijke gaten of "structurele afwezigheden" (gaps) die je in deze tekst kunt identificeren met onze bestaande SSL-seeds:
${seedsText}

Zijn er nieuwe seeds die we aan het systeem moeten toevoegen? Of sluit deze tekst naadloos aan bij bestaande seeds? Formuleer je oordeel als een 'Research Intelligence' advies.`;

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
