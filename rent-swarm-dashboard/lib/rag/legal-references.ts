/**
 * Load and manage legal reference documents
 */

import dcTenantRights from '../legal-references/dc-tenant-bill-of-rights.json';
import californiaTenantRights from '../legal-references/california-tenant-rights.json';
import newYorkTenantRights from '../legal-references/new-york-tenant-rights.json';
import texasTenantRights from '../legal-references/texas-tenant-rights.json';
import chicagoTenantRights from '../legal-references/chicago-tenant-rights.json';
import seattleTenantRights from '../legal-references/seattle-tenant-rights.json';
import bostonTenantRights from '../legal-references/boston-tenant-rights.json';

export interface LegalSection {
  id: string;
  title: string;
  text: string;
  keywords: string[];
  violation_examples: string[];
}

export interface LegalDocument {
  jurisdiction: string;
  title: string;
  sections: LegalSection[];
}

/**
 * Get all legal sections from available documents with their jurisdictions
 * Supports: Washington DC, California, New York, Texas, Chicago, Seattle, Boston
 */
export function getAllLegalSections(jurisdiction?: string): LegalSection[] {
  const documents: LegalDocument[] = [
    dcTenantRights as LegalDocument,
    californiaTenantRights as LegalDocument,
    newYorkTenantRights as LegalDocument,
    texasTenantRights as LegalDocument,
    chicagoTenantRights as LegalDocument,
    seattleTenantRights as LegalDocument,
    bostonTenantRights as LegalDocument,
  ];

  let allSections: LegalSection[] = [];

  for (const doc of documents) {
    // Match jurisdiction more flexibly (e.g., "DC" matches "Washington, DC")
    if (!jurisdiction) {
      allSections = allSections.concat(doc.sections);
    } else {
      const jurisdictionLower = jurisdiction.toLowerCase();
      const docJurisdictionLower = doc.jurisdiction.toLowerCase();
      
      // Check if jurisdiction matches (e.g., "california" or "ca" matches "California")
      // Also handle city names and abbreviations - now supports "City, State" format
      const matches = 
        docJurisdictionLower.includes(jurisdictionLower) ||
        jurisdictionLower.includes(docJurisdictionLower) ||
        // State abbreviations
        (jurisdictionLower === 'dc' && docJurisdictionLower.includes('washington')) ||
        (jurisdictionLower.includes('ca') && docJurisdictionLower.includes('california')) ||
        (jurisdictionLower.includes('ny') && docJurisdictionLower.includes('new york')) ||
        (jurisdictionLower.includes('nyc') && docJurisdictionLower.includes('new york')) ||
        (jurisdictionLower.includes('tx') && docJurisdictionLower.includes('texas')) ||
        (jurisdictionLower.includes('il') && docJurisdictionLower.includes('illinois')) ||
        (jurisdictionLower.includes('wa') && docJurisdictionLower.includes('washington') && !docJurisdictionLower.includes('dc')) ||
        (jurisdictionLower.includes('ma') && docJurisdictionLower.includes('massachusetts')) ||
        // City name matches - handle "City, State" format
        (jurisdictionLower.includes('austin') && docJurisdictionLower.includes('texas')) ||
        (jurisdictionLower.includes('chicago') && docJurisdictionLower.includes('chicago')) ||
        (jurisdictionLower.includes('seattle') && docJurisdictionLower.includes('seattle')) ||
        (jurisdictionLower.includes('boston') && docJurisdictionLower.includes('boston')) ||
        (jurisdictionLower.includes('new york') && docJurisdictionLower.includes('new york')) ||
        (jurisdictionLower.includes('san francisco') && docJurisdictionLower.includes('california')) ||
        (jurisdictionLower.includes('los angeles') && docJurisdictionLower.includes('california')) ||
        (jurisdictionLower.includes('san diego') && docJurisdictionLower.includes('california')) ||
        // Handle "City, State" format - extract state and match
        (jurisdictionLower.includes('california') && docJurisdictionLower.includes('california')) ||
        (jurisdictionLower.includes('texas') && docJurisdictionLower.includes('texas')) ||
        (jurisdictionLower.includes('new york') && docJurisdictionLower.includes('new york'));
      
      if (matches) {
        allSections = allSections.concat(doc.sections);
      }
    }
  }

  return allSections;
}

/**
 * Get the jurisdiction for a given legal section
 */
export function getJurisdictionForSection(sectionId: string): string | undefined {
  const documents: LegalDocument[] = [
    dcTenantRights as LegalDocument,
    californiaTenantRights as LegalDocument,
    newYorkTenantRights as LegalDocument,
    texasTenantRights as LegalDocument,
    chicagoTenantRights as LegalDocument,
    seattleTenantRights as LegalDocument,
    bostonTenantRights as LegalDocument,
  ];

  for (const doc of documents) {
    if (doc.sections.some(s => s.id === sectionId)) {
      return doc.jurisdiction;
    }
  }

  return undefined;
}

/**
 * Get legal section by ID
 */
export function getLegalSectionById(id: string): LegalSection | undefined {
  const sections = getAllLegalSections();
  return sections.find((s) => s.id === id);
}

