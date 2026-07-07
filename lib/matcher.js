import { containsAny, normalizeText } from './normalize.js';

function locationMatches(job, company, globalFilters) {
  const locationBlob = normalizeText(job.location || '');
  const companyCities = (company.india_cities || []).map((c) => c.toLowerCase());

  if (companyCities.length > 0) {
    if (companyCities.some((city) => locationBlob.includes(city))) {
      return true;
    }
    if (containsAny(locationBlob, ['india', 'remote india', 'remote - india'])) {
      return true;
    }
    if (locationBlob.includes('hybrid') && locationBlob.includes('india')) {
      return true;
    }
    return false;
  }

  if (company.locations?.includes('Remote')) {
    return (
      containsAny(locationBlob, ['remote', 'distributed', 'anywhere', 'global', 'india', 'apac']) ||
      locationBlob.length === 0
    );
  }

  return containsAny(locationBlob, globalFilters.global_location_include);
}

function isEngineeringRole(title, globalFilters) {
  const keywords = globalFilters.engineering_title_keywords || [];
  return containsAny(title, keywords);
}

function titleExcluded(title, company, globalFilters) {
  const excludes = [
    ...(globalFilters.global_exclude_title || []),
    ...(company.exclude_title_keywords || []),
  ];
  return containsAny(title, excludes);
}

function titleIncluded(title, company) {
  const includes = company.include_title_keywords || [];
  if (!includes.length) return false;
  return containsAny(title, includes);
}

function descriptionBoost(description, company, globalFilters) {
  const keywords = [
    ...(globalFilters.global_include_description || []),
    ...(company.include_description_keywords || []),
  ];
  return containsAny(description, keywords);
}

export function scoreJob(job, company, globalFilters) {
  const reasons = [];
  let score = 0;

  if (titleExcluded(job.role, company, globalFilters)) {
    return { matched: false, score: -10, reasons: ['excluded title keyword'] };
  }

  if (titleIncluded(job.role, company)) {
    score += 3;
    reasons.push('title keyword');
  } else {
    return { matched: false, score: 0, reasons: ['no title keyword match'] };
  }

  if (!isEngineeringRole(job.role, globalFilters)) {
    return { matched: false, score, reasons: ['not an engineering role'] };
  }

  if (locationMatches(job, company, globalFilters)) {
    score += 3;
    reasons.push('location');
  } else {
    return { matched: false, score, reasons: ['location mismatch'] };
  }

  if (descriptionBoost(job.description, company, globalFilters)) {
    score += 2;
    reasons.push('description keyword');
  }

  if (company.priority === 1) {
    score += 2;
    reasons.push('priority company');
  } else if (company.priority === 2) {
    score += 1;
    reasons.push('priority company');
  }

  const minScore = globalFilters.min_match_score ?? 4;
  return {
    matched: score >= minScore,
    score,
    reasons,
  };
}
