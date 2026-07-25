import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isHousingMentioned, isSeasonalContract, computeScore, categoryForTitle } from '../src/services/scoring.js';
import { DEFAULT_DESTINATIONS } from '../src/config/destinations.js';

describe('isHousingMentioned', () => {
  test('détecte "logé" et ses variantes accentuées', () => {
    assert.equal(isHousingMentioned('Poste logé et nourri, très demandé'), true);
    assert.equal(isHousingMentioned('Candidat logée sur place'), true);
    assert.equal(isHousingMentioned('Logement fourni pour la saison'), true);
    assert.equal(isHousingMentioned('Studio mis à disposition'), true);
    assert.equal(isHousingMentioned('Hébergement assuré par l’employeur'), true);
  });

  test('ne détecte rien quand le logement est explicitement absent ou non mentionné', () => {
    assert.equal(isHousingMentioned('Pas de logement pour ce poste, désolé'), false);
    assert.equal(isHousingMentioned('Salaire attractif, primes, mutuelle'), false);
    assert.equal(isHousingMentioned(''), false);
    assert.equal(isHousingMentioned(undefined), false);
  });

  test('ne confond pas "logement" avec un faux positif dans un autre mot', () => {
    assert.equal(isHousingMentioned('Catalogue des postes disponibles'), false);
  });
});

describe('isSeasonalContract', () => {
  test('reconnaît un contrat saisonnier via le type de contrat', () => {
    assert.equal(isSeasonalContract({ contractType: 'CDD Saisonnier' }), true);
  });

  test('reconnaît un contrat saisonnier mentionné uniquement dans la description', () => {
    assert.equal(isSeasonalContract({ contractType: 'CDD', description: 'Poste saisonnier avril-octobre' }), true);
  });

  test('renvoie false pour un CDI sans mention saisonnière', () => {
    assert.equal(isSeasonalContract({ contractType: 'CDI', description: 'Poste à l’année' }), false);
  });
});

describe('computeScore', () => {
  const corse = DEFAULT_DESTINATIONS.find((d) => d.key === 'corse');
  const alpes = DEFAULT_DESTINATIONS.find((d) => d.key === 'alpes_francaises');

  test('une offre logée + saisonnière + poste correspondant + destination confirmée obtient un score élevé', () => {
    const job = {
      title: 'Chef de rang - Restaurant à Ajaccio',
      description: 'Poste logé et nourri, CDD saisonnier',
      contractType: 'CDD Saisonnier',
    };
    const result = computeScore(job, corse, 'salle');
    assert.equal(result.housingMentioned, true);
    assert.equal(result.seasonal, true);
    assert.equal(result.categoryMatch, true);
    assert.equal(result.destinationMatch, true);
    assert.equal(result.score, 100);
  });

  test('une offre sans logement ni saisonnalité obtient un score plus faible', () => {
    const job = {
      title: 'Barman H/F',
      description: 'Poste à l’année, pas de logement fourni',
      contractType: 'CDI',
    };
    const result = computeScore(job, alpes, 'bar');
    assert.equal(result.housingMentioned, false);
    assert.equal(result.seasonal, false);
    assert.ok(result.score < 50);
  });

  test('le logement pèse plus lourd que le simple match de catégorie', () => {
    const jobWithHousingOnly = { title: 'Employé polyvalent', description: 'Logé nourri', contractType: '' };
    const jobWithCategoryOnly = { title: 'Serveur en salle', description: 'Sans logement', contractType: '' };
    const scoreHousing = computeScore(jobWithHousingOnly, corse, 'salle').score;
    const scoreCategory = computeScore(jobWithCategoryOnly, corse, 'salle').score;
    assert.ok(scoreHousing > scoreCategory);
  });
});

describe('categoryForTitle', () => {
  test('identifie la catégorie bar', () => {
    assert.equal(categoryForTitle('Barman H/F'), 'bar');
  });
  test('identifie la catégorie management', () => {
    assert.equal(categoryForTitle('Directeur adjoint de restaurant'), 'management');
  });
  test('retourne null si aucun mot-clé ne correspond', () => {
    assert.equal(categoryForTitle('Plongeur H/F'), null);
  });
});
