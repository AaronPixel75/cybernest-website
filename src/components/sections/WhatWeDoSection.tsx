import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Vote,
  GraduationCap,
  ArrowRight,
  WifiOff,
  ShieldCheck,
  Users,
  BarChart3,
  Code2,
} from 'lucide-react';
import { CORE_OFFERINGS } from '../../data/content';
import { useSiteContent } from '../../context/SiteContentContext';
import { trackAnalyticsEvent } from '../../utils/analyticsClient';

interface WhatWeDoSectionProps {
  onOpenVoxlanDemo?: () => void;
  onEnquireLessons?: () => void;
}

const SOFTWARE_LAYERS = [
  {
    id: 'local-server',
    name: 'Local-First Core',
    summary: 'Runs on campus or office computers with zero dependency on external cloud uptime.',
    spec: 'LAN · Reliable Local Storage · Instant Failover',
  },
  {
    id: 'api-mesh',
    name: 'Modular Interface Layer',
    summary: 'Clean web and desktop interfaces built for students, teachers, and administrators.',
    spec: 'TypeScript · Role-Scoped Access · Fast Workflows',
  },
  {
    id: 'offline-sync',
    name: 'Verified Audit & Sync',
    summary: 'Records every action accurately offline and exports structured institutional reports.',
    spec: 'Deterministic Checksums · Zero Data Loss',
  },
];

const VOXLAN_PILLARS = [
  {
    id: 'offline',
    label: 'Zero-Internet LAN',
    icon: WifiOff,
    headline: 'Runs smoothly without internet access',
    detail:
      'Schools host VOXLAN on a local computer and connect student voting stations over local Wi-Fi or LAN—no data bundles or unstable ISP links required.',
  },
  {
    id: 'unique-id',
    label: 'Unique IDs & Duplicate Lock',
    icon: ShieldCheck,
    headline: 'One verified student, one encrypted ballot',
    detail:
      'Each eligible learner authenticates with a unique voter ID. Once their ballot is submitted, the ID is immediately locked to prevent duplicate voting.',
  },
  {
    id: 'profiles',
    label: 'Candidate Profiles',
    icon: Users,
    headline: 'Informed choices right at the booth',
    detail:
      'Voters browse structured candidate profiles with house affiliations, portfolios, and manifestos before confirming their selection.',
  },
  {
    id: 'analytics',
    label: 'Live Results & Analytics',
    icon: BarChart3,
    headline: 'Instant counts & post-election turnout insights',
    detail:
      'Eliminate manual overnight paper counting. Administrators watch verified live tallies update in real time and review clear turnout analytics.',
  },
];

export const WhatWeDoSection: React.FC<WhatWeDoSectionProps> = ({
  onOpenVoxlanDemo,
  onEnquireLessons,
}) => {
  const { content } = useSiteContent();
  const courses = content.courses;
  const softwarePrograms = content.softwarePrograms;

  const [activeLayer, setActiveLayer] = useState(SOFTWARE_LAYERS[0].id);
  const [activeVoxlanPillar, setActiveVoxlanPillar] = useState(VOXLAN_PILLARS[0].id);
  const [activeTrackId, setActiveTrackId] = useState(courses[0]?.id || 'python');

  const selectedLayer =
    SOFTWARE_LAYERS.find((l) => l.id === activeLayer) ?? SOFTWARE_LAYERS[0];
  const selectedPillar =
    VOXLAN_PILLARS.find((p) => p.id === activeVoxlanPillar) ?? VOXLAN_PILLARS[0];
  const selectedCourse =
    courses.find((t) => t.id === activeTrackId) ?? courses[0];

  const softwareOffering = CORE_OFFERINGS[0];
  const voxlanOffering = CORE_OFFERINGS[1];
  const lessonsOffering = CORE_OFFERINGS[2];

  return (
    <section
      id="what-we-do"
      className="scroll-mt-14 relative z-20 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#FFFFFF] text-[#1A1A1A] pt-24 pb-28 lg:pt-32 lg:pb-36 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.12)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-24">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[#1A1A1A]/15 pb-10">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
              <span className="font-mono-tabular">03</span>
              <span aria-hidden="true">·</span>
              <span>Core Offerings</span>
            </div>
            <h2
              className="font-display font-bold tracking-tight text-[#1A1A1A] leading-[1.04] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)' }}
            >
              Three core offerings. Built to solve and built to teach.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-base text-[#1A1A1A]/75 max-w-md lg:ml-auto">
              CyberNest builds custom software, delivers offline school elections through VOXLAN,
              and teaches practical Python, Web Development, and AI.
            </p>
          </div>
        </div>

        {/* 01. Software Development — Architecture & Programs Showcase */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2 text-xs text-[#4C138E] font-semibold">
                <span className="font-mono-tabular">{softwareOffering.index}</span>
                <span aria-hidden="true">·</span>
                <span>{softwareOffering.subtitle}</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {softwareOffering.title}
              </h3>
              <p className="text-base leading-relaxed text-[#1A1A1A]/80">
                {softwareOffering.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-[#F2EBDD]/75 border border-[#1A1A1A]/12 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4C138E]">
                    Purpose
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#1A1A1A]/85">
                    {softwareOffering.purpose}
                  </p>
                </div>
                <div className="bg-[#F2EBDD]/75 border border-[#1A1A1A]/12 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8D5B38]">
                    Problem Solved
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#1A1A1A]/85">
                    {softwareOffering.problemSolved}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-[#1A1A1A]/85 pt-1">
                {softwareOffering.deliverables.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[#4C138E] shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 bg-[#1A1A1A] text-[#F2EBDD] p-6 sm:p-8 border border-[#1A1A1A]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 pb-4 mb-6">
                <div className="flex items-center gap-2.5 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-[#F5B800]" aria-hidden="true" />
                  <span>Application Architecture Stack</span>
                </div>
                <div className="flex flex-wrap gap-1 bg-white/5 p-1">
                  {SOFTWARE_LAYERS.map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayer(layer.id)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeLayer === layer.id
                          ? 'bg-[#F5B800] text-[#1A1A1A] font-semibold'
                          : 'text-[#F2EBDD]/75 hover:text-white'
                      }`}
                    >
                      {layer.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {SOFTWARE_LAYERS.map((layer, idx) => {
                  const isSelected = layer.id === activeLayer;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayer(layer.id)}
                      className={`text-left p-4 border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#F5B800] bg-[#4C138E]/35'
                          : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                      }`}
                    >
                      <span className="font-mono-tabular text-xs text-[#F5B800]">
                        Layer 0{idx + 1}
                      </span>
                      <p className="mt-1 font-display text-base font-semibold text-white">
                        {layer.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-white/12 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#F2EBDD]/90">{selectedLayer.summary}</p>
                  <p className="mt-1.5 font-mono-tabular text-xs text-[#F5B800]">
                    {selectedLayer.spec}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CyberNest Software Programs: Purpose, Features & Problems Solved */}
          <div className="bg-[#F2EBDD]/65 border border-[#1A1A1A]/15 p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A1A1A]/12 pb-4">
              <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                <Code2 className="w-4 h-4" aria-hidden="true" />
                <span>Software Programs Built by CyberNest</span>
              </div>
              <span className="text-xs text-[#1A1A1A]/70">
                Purpose · Key Features · Real Problems Solved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {softwarePrograms.map((program) => (
                <div
                  key={program.id}
                  className="bg-[#FFFFFF] border border-[#1A1A1A]/12 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <span
                      className="inline-block text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: program.accentHex === '#F5B800' ? '#8D5B38' : program.accentHex }}
                    >
                      {program.category}
                    </span>
                    <h4 className="font-display text-xl font-bold text-[#1A1A1A]">
                      {program.name}
                    </h4>
                    <p className="text-xs leading-relaxed text-[#1A1A1A]/80">
                      <strong className="text-[#1A1A1A]">Purpose:</strong> {program.purpose}
                    </p>
                    <p className="text-xs leading-relaxed text-[#1A1A1A]/75">
                      <strong className="text-[#8D5B38]">Solves:</strong> {program.problemSolved}
                    </p>
                  </div>

                  <ul className="pt-3 border-t border-[#1A1A1A]/10 space-y-1.5 text-xs text-[#1A1A1A]/85">
                    {program.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 shrink-0"
                          style={{ backgroundColor: program.accentHex }}
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.article>

        {/* 02. VOXLAN — Offline Electronic Voting Showcase */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-12 border-t border-[#1A1A1A]/12"
        >
          {/* Interactive VOXLAN Capabilities Frame */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-[#F2EBDD] p-6 sm:p-8 border border-[#1A1A1A]/15 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/12 pb-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                <Vote className="w-4 h-4" aria-hidden="true" />
                <span>How VOXLAN Powers School Elections</span>
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-[#8D5B38]">
                100% Offline LAN
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VOXLAN_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                const active = pillar.id === activeVoxlanPillar;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setActiveVoxlanPillar(pillar.id)}
                    className={`p-3 text-left border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1A1A1A] text-[#F5B800] border-[#1A1A1A]'
                        : 'bg-[#FFFFFF] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#4C138E]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-2" aria-hidden="true" />
                    <span className="block text-xs font-semibold leading-snug">
                      {pillar.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-wider text-[#4C138E]">
                <selectedPillar.icon className="w-4 h-4 text-[#F5B800]" aria-hidden="true" />
                <span>{selectedPillar.label}</span>
              </div>
              <h4 className="font-display text-xl font-bold text-[#1A1A1A]">
                {selectedPillar.headline}
              </h4>
              <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                {selectedPillar.detail}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
            <div className="flex items-center gap-2 text-xs text-[#8D5B38] font-semibold">
              <span className="font-mono-tabular">{voxlanOffering.index}</span>
              <span aria-hidden="true">·</span>
              <span>{voxlanOffering.subtitle}</span>
            </div>
            <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              {voxlanOffering.title}
            </h3>
            <p className="text-base leading-relaxed text-[#1A1A1A]/80">
              {voxlanOffering.description}
            </p>
            <ul className="space-y-2 text-sm text-[#1A1A1A]/85 pt-1">
              {voxlanOffering.deliverables.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 bg-[#F5B800] shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {onOpenVoxlanDemo && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenVoxlanDemo}
                  className="group inline-flex items-center gap-2 bg-[#4C138E] px-5 py-3 text-sm font-bold text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                >
                  <span className="btn-roll-wrap">
                    <span>Try Live VOXLAN Booth</span>
                    <span aria-hidden="true">Try Live VOXLAN Booth</span>
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </motion.article>

        {/* 03. Programming Lessons — Python, Web Development & Artificial Intelligence */}
        <motion.article
          id="programming-lessons"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch pt-12 border-t border-[#1A1A1A]/12"
        >
          <div className="lg:col-span-6 overflow-hidden border border-[#1A1A1A]/15 bg-[#1A1A1A]">
            <img
              src={
                selectedCourse?.imagePath ||
                '/src/assets/images/anime_editorial_studio_1795614347592.jpg'
              }
              alt={
                selectedCourse
                  ? `${selectedCourse.title} practical programming lessons at CyberNest`
                  : 'Ugandan students and mentors collaborating on practical Python, Web Development, and AI programming lessons at CyberNest'
              }
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 py-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-[#4C138E] font-semibold">
                <span className="font-mono-tabular">{lessonsOffering.index}</span>
                <span aria-hidden="true">·</span>
                <span>{lessonsOffering.subtitle}</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {lessonsOffering.title}
              </h3>
              <p className="text-base leading-relaxed text-[#1A1A1A]/80">
                {lessonsOffering.description}
              </p>
            </div>

            {/* Interactive Python / Web Dev / AI Track Selector */}
            {courses.length > 0 && selectedCourse && (
              <div className="bg-[#F2EBDD] p-6 border border-[#1A1A1A]/12 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    <GraduationCap className="w-4 h-4 text-[#4C138E]" aria-hidden="true" />
                    <span>Practical Hands-On Training Tracks</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {courses.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        setActiveTrackId(track.id);
                        trackAnalyticsEvent('button_click', `Course Track: ${track.title}`);
                      }}
                      className={`px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCourse.id === track.id
                          ? 'bg-[#4C138E] text-white border-[#4C138E]'
                          : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#4C138E]'
                      }`}
                    >
                      {track.title}
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#1A1A1A]/12 space-y-2">
                  <p className="text-xs font-semibold text-[#8D5B38]">
                    {selectedCourse.audience}
                  </p>
                  <p className="text-sm leading-relaxed text-[#1A1A1A]/85">
                    {selectedCourse.focus}
                  </p>
                  <p className="text-xs font-medium text-[#4C138E]">
                    {selectedCourse.projectOutcome}
                  </p>
                </div>

                {selectedCourse.enrollUrl && selectedCourse.enrollUrl !== '#contact' ? (
                  <a
                    href={selectedCourse.enrollUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      trackAnalyticsEvent('contact_click', `Enroll Course: ${selectedCourse.title}`)
                    }
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#4C138E] hover:text-[#1A1A1A] transition-colors"
                  >
                    <span>Enquire or Enrol in {selectedCourse.title}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                ) : (
                  onEnquireLessons && (
                    <button
                      type="button"
                      onClick={() => {
                        trackAnalyticsEvent('contact_click', `Enquire Lessons: ${selectedCourse.title}`);
                        onEnquireLessons();
                      }}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#4C138E] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <span>Enquire About Programming Lessons</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </motion.article>
      </div>
    </section>
  );
};
