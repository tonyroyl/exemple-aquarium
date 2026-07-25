import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndeedUrl, buildJoobleUrl, buildApecUrl, buildLhrUrl, buildSmartLinks } from '../src/services/links.js';

describe('buildIndeedUrl', () => {
  test('inclut le mot-clé "logé" par défaut et le lieu', () => {
    const url = buildIndeedUrl({ keyword: 'Serveur', destinationLabel: 'Corse' });
    assert.match(url, /^https:\/\/fr\.indeed\.com\/jobs\?/);
    assert.match(url, /q=Serveur(%20|\+)log%C3%A9/);
    assert.match(url, /l=Corse/);
  });

  test('n’ajoute pas "logé" quand housingOnly est désactivé', () => {
    const url = buildIndeedUrl({ keyword: 'Serveur', destinationLabel: 'Corse', housingOnly: false });
    assert.doesNotMatch(url, /log%C3%A9/);
  });
});

describe('buildJoobleUrl', () => {
  test('utilise le paramètre ckey avec mot-clé + destination', () => {
    const url = buildJoobleUrl({ keyword: 'Barman', destinationLabel: 'Suisse' });
    assert.match(url, /^https:\/\/fr\.jooble\.org\/SearchResult\?ckey=/);
    assert.match(url, /Suisse/);
  });
});

describe('buildApecUrl', () => {
  test('utilise le paramètre motsCles confirmé sur cadres.apec.fr', () => {
    const url = buildApecUrl({ keyword: 'Directeur adjoint', destinationLabel: 'Alpes françaises' });
    assert.match(url, /^https:\/\/cadres\.apec\.fr\/home\/mes-offres\/recherche-des-offres-demploi\/liste-des-offres-demploi\.html\?motsCles=/);
  });
});

describe('buildLhrUrl', () => {
  test('pointe vers le slug de territoire vérifié', () => {
    assert.equal(buildLhrUrl({ lhrSlug: 'corse' }), 'https://www.lhotellerie-restauration.fr/emploi/corse');
    assert.equal(buildLhrUrl({ lhrSlug: 'saint-barthelemy' }), 'https://www.lhotellerie-restauration.fr/emploi/saint-barthelemy');
  });

  test('retombe sur la page générale sans slug', () => {
    assert.equal(buildLhrUrl({}), 'https://www.lhotellerie-restauration.fr/emploi/offre-emploi');
  });
});

describe('buildSmartLinks', () => {
  test('retourne les 4 sources attendues', () => {
    const destination = { key: 'corse', label: 'Corse', lhrSlug: 'corse' };
    const links = buildSmartLinks({ keyword: 'Bar', destination, housingOnly: true });
    const sources = links.map((l) => l.source);
    assert.ok(sources.includes('Indeed'));
    assert.ok(sources.includes('Jooble'));
    assert.ok(sources.some((s) => s.includes('APEC')));
    assert.ok(sources.some((s) => s.includes('Hôtellerie-Restauration')));
    links.forEach((l) => assert.match(l.url, /^https:\/\//));
  });
});
