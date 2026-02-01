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
import badLeaseExamples from './bad-lease-examples.json';

export interface LegalSection {
  id: string;
  title: string;
  text: string;
  keywords: string[];
  violation_examples: string[];
  jurisdiction?: string; // Add jurisdiction to the section itself
}

export interface LegalDocument {
  jurisdiction: string;
  title: string;
  sections: LegalSection[];
}

export interface BadLeaseExample {
  id: string;
  type: string;
  excerpt: string;
  violation: string;
  explanation: string;
  jurisdiction: string;
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

  // Debug logging
  console.log('📚 getAllLegalSections called with jurisdiction:', jurisdiction);

  // If no jurisdiction provided, return all sections
  if (!jurisdiction || jurisdiction.trim() === '') {
    console.log('⚠️ No jurisdiction provided - returning ALL sections from all jurisdictions');
    for (const doc of documents) {
      allSections = allSections.concat(doc.sections);
    }
    return allSections;
  }

  // Jurisdiction is provided - only match specific documents
  const jurisdictionLower = jurisdiction.toLowerCase().trim();
  
  // Extract state from "City, State" format for matching
  const jurisdictionParts = jurisdictionLower.split(',').map(p => p.trim());
  const cityFromJurisdiction = jurisdictionParts.length > 1 ? jurisdictionParts[0] : '';
  const stateFromJurisdiction = jurisdictionParts.length > 1 ? jurisdictionParts[jurisdictionParts.length - 1] : jurisdictionLower;

  for (const doc of documents) {
    const docJurisdictionLower = doc.jurisdiction.toLowerCase().trim();
    let matches = false;
    
    // Exact match first (most specific)
    if (docJurisdictionLower === jurisdictionLower) {
      matches = true;
    }
    // Match by state name (e.g., "texas" matches "Texas" document)
    // This is the key match for "Austin, Texas" -> "Texas"
    else if (docJurisdictionLower === stateFromJurisdiction) {
      matches = true;
    }
    // City-specific matches (e.g., "Chicago" document matches "Chicago, Illinois")
    else if (docJurisdictionLower.includes('chicago') && jurisdictionLower.includes('chicago')) {
      matches = true;
    } else if (docJurisdictionLower.includes('seattle') && jurisdictionLower.includes('seattle')) {
      matches = true;
    } else if (docJurisdictionLower.includes('boston') && jurisdictionLower.includes('boston')) {
      matches = true;
    }
    // State abbreviation matches
    else if (stateFromJurisdiction === 'dc' && docJurisdictionLower.includes('washington') && docJurisdictionLower.includes('dc')) {
      matches = true;
    } else if (stateFromJurisdiction === 'tx' && docJurisdictionLower === 'texas') {
      matches = true;
    } else if (stateFromJurisdiction === 'ca' && docJurisdictionLower === 'california') {
      matches = true;
    } else if ((stateFromJurisdiction === 'ny' || stateFromJurisdiction === 'nyc') && docJurisdictionLower.includes('new york')) {
      matches = true;
    } else if (stateFromJurisdiction === 'il' && docJurisdictionLower.includes('illinois')) {
      matches = true;
    } else if (stateFromJurisdiction === 'wa' && docJurisdictionLower.includes('washington') && !docJurisdictionLower.includes('dc')) {
      matches = true;
    } else if (stateFromJurisdiction === 'ma' && docJurisdictionLower.includes('massachusetts')) {
      matches = true;
    }
    // City to state matches (e.g., "Austin" -> "Texas")
    else if (cityFromJurisdiction === 'austin' && docJurisdictionLower === 'texas') {
      matches = true;
    } else if ((cityFromJurisdiction === 'san francisco' || cityFromJurisdiction === 'los angeles' || cityFromJurisdiction === 'san diego') && docJurisdictionLower === 'california') {
      matches = true;
    } else if ((cityFromJurisdiction === 'nyc' || cityFromJurisdiction === 'new york city' || cityFromJurisdiction === 'manhattan' || cityFromJurisdiction === 'brooklyn') && docJurisdictionLower.includes('new york')) {
      matches = true;
    }
    
    // Only add sections if there's a clear match - prevent false matches
    if (matches) {
      console.log(`✅ Matched document: ${doc.jurisdiction} (${doc.sections.length} sections)`);
      // Add jurisdiction to each section so we know where it came from
      const sectionsWithJurisdiction = doc.sections.map(section => ({
        ...section,
        jurisdiction: doc.jurisdiction
      }));
      allSections = allSections.concat(sectionsWithJurisdiction);
    } else {
      console.log(`❌ No match for document: ${doc.jurisdiction}`);
    }
  }

  console.log(`📋 Total sections returned: ${allSections.length}`);
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

/**
 * Get all bad lease examples for RAG matching
 * Can be filtered by type or jurisdiction
 */
export function getBadLeaseExamples(type?: string, jurisdiction?: string): BadLeaseExample[] {
  const examples = (badLeaseExamples as { badLeaseExamples: BadLeaseExample[] }).badLeaseExamples;
  
  let filtered = examples;
  
  if (type) {
    filtered = filtered.filter(ex => ex.type === type || ex.type === 'general');
  }
  
  if (jurisdiction && jurisdiction !== 'general') {
    // For now, all examples are general, but we can filter by jurisdiction in the future
    // filtered = filtered.filter(ex => ex.jurisdiction === jurisdiction || ex.jurisdiction === 'general');
  }
  
  return filtered;
}

