'use strict';











const { callProcedure } = require("../../config/db");


const ALIAS_MAP = {
  "js": ["javascript"],
  "javascript": ["js"],
  "ts": ["typescript"],
  "typescript": ["ts"],
  "react": ["reactjs", "react.js"],
  "reactjs": ["react", "react.js"],
  "react.js": ["react", "reactjs"],
  "node": ["node.js", "nodejs"],
  "node.js": ["node", "nodejs"],
  "nodejs": ["node", "node.js"],
  "vue": ["vuejs", "vue.js"],
  "vuejs": ["vue", "vue.js"],
  "angular": ["angularjs", "angular.js"],
  "angularjs": ["angular"],
  "angular.js": ["angular"],
  "next": ["next.js", "nextjs"],
  "next.js": ["next", "nextjs"],
  "nextjs": ["next", "next.js"],
  "mongo": ["mongodb"],
  "mongodb": ["mongo"],
  "postgres": ["postgresql"],
  "postgresql": ["postgres"],
  "mysql": ["my sql", "my-sql"],
  "my sql": ["mysql"],
  "my-sql": ["mysql"],
  "mssql": ["sql server", "microsoft sql server", "ms sql"],
  "sql server": ["mssql", "ms sql"],
  "spring": ["spring boot", "spring framework"],
  "spring boot": ["spring", "springboot"],
  "springboot": ["spring boot", "spring"],
  "dotnet": [".net", "dot net"],
  ".net": ["dotnet", "dot net"],
  "expressjs": ["express", "express.js"],
  "express": ["expressjs", "express.js"],
  "express.js": ["express", "expressjs"],
  "aws": ["amazon web services", "amazon aws"],
  "gcp": ["google cloud", "google cloud platform"],
  "k8s": ["kubernetes"],
  "kubernetes": ["k8s"],
  "docker": ["docker container", "docker compose"],
  "java": ["java se", "java ee"],
  "python": ["python3", "python 3"],
  "rest": ["rest api", "restful", "restful api", "rest apis"],
  "rest api": ["rest", "restful", "restful api", "rest apis"],
  "restful": ["rest", "rest api"],
  "graphql": ["graph ql"],
  "jwt": ["json web token"],
  "oauth": ["oauth2", "oauth 2.0"],
  "oauth2": ["oauth", "oauth 2.0"]
};

function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9.+#]/g, " ").replace(/\s+/g, " ").trim();
}

function parseSkills(skillSetStr) {
  if (!skillSetStr) return [];
  return skillSetStr.
  split(/[,;|\/\n]/).
  map((s) => normalise(s)).
  filter(Boolean);
}

function skillMatches(required, candidateSkills, resumeText = '') {
  const reqNorm = normalise(required);


  if (candidateSkills.includes(reqNorm)) return true;


  const aliases = ALIAS_MAP[reqNorm] || [];
  if (aliases.some((a) => candidateSkills.includes(a))) return true;



  const reqWords = reqNorm.split(' ');
  const prefixMatch = (target) => {
    const tWords = target.split(' ');
    return reqWords.length <= tWords.length &&
    reqWords.every((w, i) => tWords[i] === w);
  };
  if (candidateSkills.some(prefixMatch)) return true;


  if (aliases.some((alias) => candidateSkills.some((cs) => {
    const aWords = alias.split(' ');
    const cWords = cs.split(' ');
    return aWords.length <= cWords.length && aWords.every((w, i) => cWords[i] === w);
  }))) return true;



  if (resumeText) {
    const rt = normalise(resumeText);

    const wordIn = (term) => {
      const t = normalise(term);
      return rt === t || rt.startsWith(t + ' ') || rt.endsWith(' ' + t) ||
      rt.includes(' ' + t + ' ') || rt.includes(' ' + t + ',') ||
      rt.includes('\n' + t) || rt.includes(t + '\n');
    };
    if (wordIn(reqNorm)) return true;
    if (aliases.some((a) => wordIn(a))) return true;
  }

  return false;
}





function parseMinExperience(expLevel) {
  if (!expLevel) return 0;
  const match = String(expLevel).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}


function computeScore({ candidateSkillSet, relevantExperience, jobSkillSet, jobExperienceLevel, resumeText = '' }) {
  const jobSkills = parseSkills(jobSkillSet);
  const candSkills = parseSkills(candidateSkillSet);
  const candExp = Number(relevantExperience) || 0;
  const reqExp = parseMinExperience(jobExperienceLevel);


  const matched = [];
  const missing = [];

  if (jobSkills.length === 0) {

  } else {
    for (const skill of jobSkills) {
      if (skillMatches(skill, candSkills, resumeText)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }
  }

  const skillScore = jobSkills.length > 0 ?
  Math.round(matched.length / jobSkills.length * 100) :
  100;


  let expScore;
  if (reqExp === 0) {
    expScore = 100;
  } else if (candExp >= reqExp) {
    expScore = 100;
  } else {
    expScore = Math.round(candExp / reqExp * 100);
  }


  const total = Math.round(skillScore * 0.6 + expScore * 0.4);


  let recommendation;
  if (total >= 80) recommendation = "Highly Suitable";else
  if (total >= 65) recommendation = "Suitable";else
  if (total >= 45) recommendation = "Partially Suitable";else
  recommendation = "Not Suitable";

  return {
    matchScore: total,
    skillScore,
    expScore,
    matched,
    missing,
    recommendation
  };
}






async function computeAndStore(candidateId, jobReqId) {

  const candResults = await callProcedure("sp_rec_get_candidate_match_inputs(?)", [candidateId]);
  const cand = (candResults[0] ?? [])[0];
  if (!cand) throw new Error(`Candidate ${candidateId} not found`);


  const jobResults = await callProcedure("sp_rec_get_job_match_inputs(?)", [jobReqId]);
  const job = (jobResults[0] ?? [])[0];
  if (!job) throw new Error(`Job ${jobReqId} not found`);

  const result = computeScore({
    candidateSkillSet: cand.skill_set,
    relevantExperience: cand.relevant_experience,
    jobSkillSet: job.skill_set,
    jobExperienceLevel: job.experience_level
  });


  const rows = await callProcedure(
    "sp_rec_upsert_match(?, ?, ?, ?, ?, ?, ?, ?)",
    [
    candidateId,
    jobReqId,
    result.matchScore,
    result.skillScore,
    result.expScore,
    JSON.stringify(result.matched),
    JSON.stringify(result.missing),
    result.recommendation]

  );

  return (rows[0] ?? [])[0];
}

async function getMatch(candidateId, jobReqId) {
  const rows = await callProcedure(
    "sp_rec_get_match(?, ?)",
    [candidateId, jobReqId]
  );
  return (rows[0] ?? [])[0] || null;
}

async function listByJob(jobReqId) {
  const rows = await callProcedure(
    "sp_rec_list_matches_by_job(?)",
    [jobReqId]
  );
  return rows[0] ?? [];
}





function autoComputeAsync(candidateId, jobReqId) {
  if (!candidateId || !jobReqId) return;
  setImmediate(async () => {
    try {
      await computeAndStore(candidateId, jobReqId);
      console.log(`[ResumeMatch] Scored candidate ${candidateId} vs job ${jobReqId}`);
    } catch (err) {
      console.error(`[ResumeMatch] Failed for candidate ${candidateId}:`, err.message);
    }
  });
}





async function quickMatch({ jobReqId, candidateSkills, candidateExperience, resumeText = '' }) {
  const jobResults = await callProcedure("sp_rec_get_job_match_inputs(?)", [jobReqId]);
  const job = (jobResults[0] ?? [])[0];
  if (!job) throw new Error(`Job ${jobReqId} not found`);

  const result = computeScore({
    candidateSkillSet: candidateSkills,
    relevantExperience: candidateExperience,
    jobSkillSet: job.skill_set,
    jobExperienceLevel: job.experience_level,
    resumeText
  });

  return { ...result, jobTitle: job.title, jobExperienceLevel: job.experience_level };
}

module.exports = { computeAndStore, getMatch, listByJob, autoComputeAsync, quickMatch };
