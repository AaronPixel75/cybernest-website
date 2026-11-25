import test from 'node:test';
import assert from 'node:assert/strict';
import {
  castVoxlanBallot,
  computeVoxlanAnalytics,
  createInitialVoxlanState,
  verifyVoterId,
} from './voxlanLogic';
import { validateContactForm } from './contactValidation';
import {
  buildBreadcrumbs,
  clampChapterIndex,
  filterProjects,
  parseRoute,
  wrapCarouselIndex,
} from './navigationLogic';
import { createProductRegistry, INITIAL_PRODUCTS } from '../data/content';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';
import { filterTestimonials, TESTIMONIALS } from '../data/testimonials';

test('VOXLAN voter verification rejects unknown or duplicate voter IDs', () => {
  const state = createInitialVoxlanState();

  const missing = verifyVoterId(state, '');
  assert.equal(missing.valid, false);

  const unknown = verifyVoterId(state, 'UNKNOWN-999');
  assert.equal(unknown.valid, false);

  const alreadyVoted = verifyVoterId(state, 'ug-sch-001');
  assert.equal(alreadyVoted.valid, false);

  const eligible = verifyVoterId(state, '  ug-sch-042 ');
  assert.equal(eligible.valid, true);
  assert.equal(eligible.normalizedId, 'UG-SCH-042');
});

test('VOXLAN ballot casting increments candidate votes and prevents double voting', () => {
  const state = createInitialVoxlanState();
  const initialAnalytics = computeVoxlanAnalytics(state);
  const beforeTotal = initialAnalytics.totalVotes;

  const firstAttempt = castVoxlanBallot(state, 'UG-SCH-042', 'cand-a');
  assert.equal(firstAttempt.ok, true);

  const afterAnalytics = computeVoxlanAnalytics(firstAttempt.nextState);
  assert.equal(afterAnalytics.totalVotes, beforeTotal + 1);
  assert.equal(
    firstAttempt.nextState.candidates.find((c) => c.id === 'cand-a')?.votes,
    49,
  );

  const secondAttempt = castVoxlanBallot(firstAttempt.nextState, 'UG-SCH-042', 'cand-b');
  assert.equal(secondAttempt.ok, false);
  assert.ok(secondAttempt.error);
});

test('Contact form validation flags missing fields and bad email formats', () => {
  const invalid = validateContactForm({
    enquiryType: 'project',
    fullName: 'A',
    email: 'not-an-email',
    organization: '',
    message: 'Hi',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.message);

  const valid = validateContactForm({
    enquiryType: 'partnership',
    fullName: 'Amina Namukasa',
    email: 'amina@school.ug',
    organization: 'Kampala High School',
    message: 'We would like to evaluate Voxlan for our upcoming prefect elections.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('Product registry preserves flagship products and allows deduplicated extensions', () => {
  const registry = createProductRegistry(INITIAL_PRODUCTS, [
    {
      id: 'cybernest-portal-suite',
      name: 'CYBERNEST PORTAL',
      category: 'Software Application',
      tagline: 'Modular institutional records and reporting portal.',
      summary: 'Custom software portal for Ugandan schools.',
      problemSolved: 'Replaces fragmented paper registers.',
      features: ['Role-based access & offline sync'],
      accentHex: '#8D5B38',
      isFlagship: false,
      architectureNote: 'Local-first web application',
    },
    INITIAL_PRODUCTS[0], // duplicate voxlan should be ignored
  ]);
  assert.equal(registry.length, 3);
  assert.equal(registry[0].id, 'voxlan');
});

test('Carousel wrapping and chapter clamping handle boundary indices cleanly', () => {
  assert.equal(wrapCarouselIndex(0, -1, 5), 4);
  assert.equal(wrapCarouselIndex(4, 1, 5), 0);
  assert.equal(clampChapterIndex(-2, 5), 0);
  assert.equal(clampChapterIndex(9, 5), 4);
});

test('Testimonial filtering separates VOXLAN administrators and training graduates accurately', () => {
  const all = filterTestimonials(TESTIMONIALS, 'all');
  const voxlan = filterTestimonials(TESTIMONIALS, 'voxlan');
  const students = filterTestimonials(TESTIMONIALS, 'student');

  assert.equal(all.length, TESTIMONIALS.length);
  assert.ok(voxlan.length > 0);
  assert.ok(students.length > 0);
  assert.equal(voxlan.length + students.length, all.length);
  assert.ok(voxlan.every((t) => t.category === 'voxlan'));
  assert.ok(students.every((t) => t.category === 'student'));
});

test('Multi-page route parser and breadcrumbs map CyberNest routes accurately', () => {
  assert.deepEqual(parseRoute('/'), { page: 'home', activeNav: 'home', pathname: '/' });
  assert.deepEqual(parseRoute('/about/'), { page: 'about', activeNav: 'about', pathname: '/about' });
  assert.deepEqual(parseRoute('/solutions'), {
    page: 'solutions',
    activeNav: 'solutions',
    pathname: '/solutions',
  });
  assert.deepEqual(parseRoute('/products/voxlan'), {
    page: 'product-detail',
    activeNav: 'products',
    slug: 'voxlan',
    pathname: '/products/voxlan',
  });
  assert.deepEqual(parseRoute('/academy/python-programming'), {
    page: 'academy-detail',
    activeNav: 'academy',
    slug: 'python-programming',
    pathname: '/academy/python-programming',
  });
  assert.deepEqual(parseRoute('/work/voxlan'), {
    page: 'work-detail',
    activeNav: 'work',
    slug: 'voxlan',
    pathname: '/work/voxlan',
  });
  assert.deepEqual(parseRoute('/testimonials'), {
    page: 'testimonials',
    activeNav: 'about',
    pathname: '/testimonials',
  });
  assert.deepEqual(parseRoute('/contact'), {
    page: 'contact',
    activeNav: 'contact',
    pathname: '/contact',
  });
  assert.equal(parseRoute('/unknown/page').page, 'not-found');

  const workDetailCrumbs = buildBreadcrumbs(parseRoute('/work/voxlan'), DEFAULT_SITE_CONTENT);
  assert.equal(workDetailCrumbs.length, 3);
  assert.equal(workDetailCrumbs[1].path, '/work');
  assert.equal(workDetailCrumbs[2].label, 'VOXLAN — Offline Electronic Voting System');
});

test('Project showcase filtering returns expected items per category', () => {
  const all = filterProjects(DEFAULT_SITE_CONTENT.projects, 'All');
  const edTech = filterProjects(DEFAULT_SITE_CONTENT.projects, 'Education Technology');
  const ai = filterProjects(DEFAULT_SITE_CONTENT.projects, 'Artificial Intelligence');

  assert.equal(all.length, DEFAULT_SITE_CONTENT.projects.length);
  assert.ok(edTech.length > 0);
  assert.ok(edTech.every((p) => p.category === 'Education Technology'));
  assert.ok(ai.length > 0);
  assert.ok(ai.every((p) => p.category === 'Artificial Intelligence'));
});
