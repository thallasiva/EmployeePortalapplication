'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const OpenAI = require('openai');
const {
  generateNextQuestion,
  normalizeSkillName,
  buildInterviewPlan,
  questionSimilarity,
  validateGeneratedQuestion,
  fallbackNextQuestion,
  fallbackQuestionOrEnd,
} = require('./aiInterview.service');

test('normalizes arbitrary technology names and preserves aliases', () => {
  assert.equal(normalizeSkillName('  Salesforce   Data Cloud '), 'salesforce data cloud');
  const plan = buildInterviewPlan({
    skills: [{
      name: 'Unity Catalog',
      canonicalName: 'Databricks Unity Catalog',
      aliases: ['UC'],
      priority: 'required',
      evidence: 'Databricks Unity Catalog',
      evidenceSource: 'job_description',
      confidence: 'high',
      relatedConcepts: ['data governance'],
      questionFocuses: ['practical'],
      rubric: ['Explains access controls using the supplied project context'],
    }],
  }, { requiredSkills: 'Databricks Unity Catalog' }, 'Job description requires Databricks Unity Catalog administration.');

  assert.equal(plan.skills[0].canonicalName, 'Databricks Unity Catalog');
  assert.equal(plan.skills[0].reviewRequired, false);
  assert.deepEqual(plan.skills[0].aliases, ['UC', 'Unity Catalog']);
});

test('flags skills whose evidence is absent instead of fabricating related concepts', () => {
  const plan = buildInterviewPlan({
    skills: [{
      name: 'NewPlatform X',
      evidence: 'The platform supports encrypted workflows',
      confidence: 'high',
      relatedConcepts: ['invented feature'],
      rubric: ['invented answer'],
    }],
  }, {}, 'No matching platform or feature is in the job or resume.');

  assert.equal(plan.skills[0].reviewRequired, true);
  assert.deepEqual(plan.skills[0].relatedConcepts, []);
  assert.deepEqual(plan.skills[0].rubric, []);
});

test('rejects unknown skills and enforces the configured per-skill follow-up limit', () => {
  const state = {
    followUpLimit: 1,
    followUpCounts: {},
    transcript: [],
    skillPlan: {
      skills: [{
        name: 'Apache Flink',
        canonicalName: 'Apache Flink',
        aliases: ['Flink'],
        rubric: [],
        reviewRequired: false,
      }],
    },
  };
  const firstFollowUp = {
    question: 'How did you handle late-arriving events in your Apache Flink pipeline?',
    skill: 'Flink',
    type: 'clarification',
    stage: 'follow_up',
    difficulty: 'intermediate',
    isFollowUp: true,
  };

  assert.ok(validateGeneratedQuestion(firstFollowUp, state));
  assert.equal(state.followUpCounts['apache flink'], 1);
  assert.equal(validateGeneratedQuestion({
    ...firstFollowUp,
    question: 'Tell me about a different operational failure you encountered, and how you communicated its impact to stakeholders.',
  }, state), null);
  assert.equal(validateGeneratedQuestion({
    ...firstFollowUp,
    skill: 'Unknown Platform',
    isFollowUp: false,
  }, state), null);
  assert.equal(state.reviewItems[0].skill, 'Unknown Platform');
});

test('enforces follow-up limits even when generated questions omit the follow-up flag', () => {
  const state = {
    followUpLimit: 0,
    transcript: [{ question: { skill: 'Apache Flink' } }],
    skillPlan: {
      skills: [{
        name: 'Apache Flink',
        canonicalName: 'Apache Flink',
        aliases: [],
        reviewRequired: false,
      }],
    },
  };
  assert.equal(validateGeneratedQuestion({
    question: 'How would you monitor streaming job latency and backpressure over time?',
    skill: 'Apache Flink',
    type: 'practical',
    stage: 'practical',
    difficulty: 'intermediate',
    isFollowUp: false,
  }, state), null);
});

test('detects semantically close repeated wording after removing technology names', () => {
  const first = 'Walk me through how you would validate permissions and access boundaries for a shared production data catalog.';
  const repeated = 'Explain how you would check access permissions and boundaries for a production catalog shared by teams.';
  assert.ok(questionSimilarity(first, repeated, ['Databricks Unity Catalog']) >= 0.5);
});

test('fallback questions avoid using technologies marked for recruiter review', () => {
  const question = fallbackNextQuestion({
    profile: { jobTitle: 'Data Engineer' },
    transcript: [],
    questionCount: 6,
    skillPlan: {
      reviewRequired: true,
      skills: [{
        name: 'Unknown Data Platform',
        priority: 'required',
        reviewRequired: true,
      }],
    },
  });
  assert.equal(question.stage, 'introduction');
  assert.equal(question.skill, '');
  assert.doesNotMatch(question.question, /Unknown Data Platform/);
});

test('fallback ends rather than inventing questions when all remaining skills need review', () => {
  const state = {
    transcript: [{ question: { skill: '' } }, { question: { skill: '' } }],
    skillPlan: {
      skills: [{ name: 'Unfamiliar Platform', reviewRequired: true }],
    },
  };
  assert.equal(fallbackQuestionOrEnd(state).nextAction, 'END_INTERVIEW');
});

test('adaptive generation retries a semantic duplicate and releases only the audited question', async (t) => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  });
  const rubric = 'Explains how to verify the scope of a permission change';
  const proposal = {
    nextAction: 'ASK_QUESTION', skill: 'Unity Catalog', stage: 'scenario',
    type: 'scenario', difficulty: 'fundamental', expectedEvidence: [rubric, 'Invented criterion'],
  };
  const replies = [
    { ...proposal, question: 'How would you make sure a shared catalog stays safe?' },
    { verdict: 'duplicate' },
    { ...proposal, question: 'How would you verify that revoking a grant left unrelated teams unaffected?' },
    { verdict: 'approved' },
  ];
  const completions = new OpenAI({ apiKey: 'test-key' }).chat.completions;
  const mock = t.mock.method(Object.getPrototypeOf(completions), 'create', async () => ({
    choices: [{ message: { content: JSON.stringify(replies.shift()) } }],
  }));
  const question = await generateNextQuestion({
    profile: { jobDescription: 'Administer Databricks Unity Catalog.' },
    skillPlan: { skills: [{ name: 'Databricks Unity Catalog', aliases: ['Unity Catalog'], rubric: [rubric] }] },
    transcript: [
      { question: { question: 'Describe your work on governance for a shared platform.' } },
      { question: { question: 'Tell me about your project responsibilities.', difficulty: 'proficient' }, evaluation: { score: 9 } },
    ],
  });
  assert.equal(mock.mock.callCount(), 4);
  assert.match(question.question, /revoking a grant/);
  assert.equal(question.skill, 'Databricks Unity Catalog');
  assert.equal(question.difficulty, 'advanced');
  assert.deepEqual(question.expectedEvidence, [rubric]);
});
