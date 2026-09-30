import React, { useState } from 'react';
import { Database, Key, Link2, Copy, Check, Info } from 'lucide-react';
import { SqlBlock } from '../components/common/SqlBlock';

export const SchemaPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const rawSchemaSql = `-- Criminal Record Management System (CRMS) Schema
-- MySQL 8.0 Compliant DDL

CREATE DATABASE IF NOT EXISTS crm_db;
USE crm_db;

-- 1. POLICE Table
CREATE TABLE POLICE (
    police_id INT PRIMARY KEY,
    \`rank\` VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    number VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 2. CRIMINAL Table
CREATE TABLE CRIMINAL (
    criminal_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    crime VARCHAR(100) NOT NULL,
    investigating_officer INT NOT NULL,
    investigation_status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_criminal_officer FOREIGN KEY (investigating_officer) 
        REFERENCES POLICE(police_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. COURT_RECORD Table
CREATE TABLE COURT_RECORD (
    court_room_number INT PRIMARY KEY,
    criminal_id INT NOT NULL,
    CONSTRAINT fk_court_criminal FOREIGN KEY (criminal_id) 
        REFERENCES CRIMINAL(criminal_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. JAIL Table (criminal_id is UNIQUE so one criminal has one jail record)
CREATE TABLE JAIL (
    location VARCHAR(100) NOT NULL,
    criminal_id INT NOT NULL UNIQUE,
    barrack_number VARCHAR(50) NOT NULL,
    sentence VARCHAR(50) NOT NULL,
    CONSTRAINT fk_jail_criminal FOREIGN KEY (criminal_id) 
        REFERENCES CRIMINAL(criminal_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(rawSchemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tables = [
    {
      name: 'POLICE',
      description: 'Department officers, ranks, assigned branches, and contact particulars',
      columns: [
        { name: 'police_id', type: 'INT', isPK: true, isFK: false, desc: 'Primary key badge identifier' },
        { name: 'rank', type: 'VARCHAR(50)', isPK: false, isFK: false, desc: 'MySQL 8 reserved word (always backticked)' },
        { name: 'name', type: 'VARCHAR(100)', isPK: false, isFK: false, desc: 'Full legal name of the officer' },
        { name: 'branch', type: 'VARCHAR(100)', isPK: false, isFK: false, desc: 'Unit / division (e.g. Crime Branch, Cyber Crime)' },
        { name: 'age', type: 'INT', isPK: false, isFK: false, desc: 'Officer age (constrained 21-65)' },
        { name: 'number', type: 'VARCHAR(20)', isPK: false, isFK: false, desc: 'Official station / personal phone' },
        { name: 'address', type: 'VARCHAR(255)', isPK: false, isFK: false, desc: 'Station or residential address' },
      ],
    },
    {
      name: 'CRIMINAL',
      description: 'Central offender registry linked to investigating officers',
      columns: [
        { name: 'criminal_id', type: 'INT', isPK: true, isFK: false, desc: 'Primary key criminal file number' },
        { name: 'name', type: 'VARCHAR(100)', isPK: false, isFK: false, desc: 'Perpetrator legal name' },
        { name: 'age', type: 'INT', isPK: false, isFK: false, desc: 'Perpetrator age (constrained 18-100)' },
        { name: 'crime', type: 'VARCHAR(100)', isPK: false, isFK: false, desc: 'Charge / crime classification' },
        { name: 'investigating_officer', type: 'INT', isPK: false, isFK: true, ref: 'POLICE.police_id', desc: 'FK to assigned officer badge ID' },
        { name: 'investigation_status', type: 'VARCHAR(50)', isPK: false, isFK: false, desc: 'Open | Under Investigation | Closed' },
      ],
    },
    {
      name: 'COURT_RECORD',
      description: 'Judicial docket assignments mapping courtroom numbers to defendants',
      columns: [
        { name: 'court_room_number', type: 'INT', isPK: true, isFK: false, desc: 'Primary key judicial hearing chamber' },
        { name: 'criminal_id', type: 'INT', isPK: false, isFK: true, ref: 'CRIMINAL.criminal_id', desc: 'FK linking defendant to chamber' },
      ],
    },
    {
      name: 'JAIL',
      description: 'Correctional detention facility, barrack allocations, and sentencing terms',
      columns: [
        { name: 'location', type: 'VARCHAR(100)', isPK: false, isFK: false, desc: 'Prison / correctional center name' },
        { name: 'criminal_id', type: 'INT', isPK: false, isFK: true, ref: 'CRIMINAL.criminal_id', desc: 'UNIQUE FK (1 criminal = 1 jail record)' },
        { name: 'barrack_number', type: 'VARCHAR(50)', isPK: false, isFK: false, desc: 'Cell / barrack reference' },
        { name: 'sentence', type: 'VARCHAR(50)', isPK: false, isFK: false, desc: 'Judicially mandated incarceration term' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Relational Database Schema & ER Diagram
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              MySQL 8.0 InnoDB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            4 normalized relational entities with enforced foreign keys, cascading constraints, and unique indices
          </p>
        </div>

        <button
          onClick={handleCopySchema}
          className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-fast shrink-0"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          <span>{copied ? 'Copied schema' : 'Copy schema.sql'}</span>
        </button>
      </div>

      {/* Clean ER-style Diagram (SVG) */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Database size={14} className="text-slate-500" />
            <span>Entity Relationship Diagram (ERD)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Normalized Relational Model</span>
        </div>

        <div className="w-full overflow-x-auto py-2">
          <svg
            viewBox="0 0 920 320"
            className="w-full min-w-[760px] text-slate-800 dark:text-slate-200 select-none"
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
              </marker>
            </defs>

            {/* Entity 1: POLICE */}
            <g transform="translate(30, 20)">
              <rect width="210" height="190" rx="4" className="fill-slate-50 dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700 stroke-1" />
              <rect width="210" height="28" rx="4" className="fill-slate-800 dark:fill-slate-800" />
              <text x="105" y="19" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">POLICE</text>
              
              <text x="12" y="50" fontSize="11" fontWeight="bold" fill="#0284c7">PK police_id (INT)</text>
              <text x="12" y="72" fontSize="11" fill="currentColor">`rank` (VARCHAR 50)</text>
              <text x="12" y="94" fontSize="11" fill="currentColor">name (VARCHAR 100)</text>
              <text x="12" y="116" fontSize="11" fill="currentColor">branch (VARCHAR 100)</text>
              <text x="12" y="138" fontSize="11" fill="currentColor">age (INT)</text>
              <text x="12" y="160" fontSize="11" fill="currentColor">number (VARCHAR 20)</text>
              <text x="12" y="182" fontSize="11" fill="currentColor">address (VARCHAR 255)</text>
            </g>

            {/* Connection: POLICE -> CRIMINAL (1:N) */}
            <path
              d="M 240 70 L 350 70"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="295" y="62" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">1 : N (investigates)</text>

            {/* Entity 2: CRIMINAL */}
            <g transform="translate(350, 20)">
              <rect width="220" height="210" rx="4" className="fill-slate-50 dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700 stroke-1" />
              <rect width="220" height="28" rx="4" className="fill-slate-800 dark:fill-slate-800" />
              <text x="110" y="19" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">CRIMINAL</text>

              <text x="12" y="50" fontSize="11" fontWeight="bold" fill="#0284c7">PK criminal_id (INT)</text>
              <text x="12" y="74" fontSize="11" fill="currentColor">name (VARCHAR 100)</text>
              <text x="12" y="98" fontSize="11" fill="currentColor">age (INT)</text>
              <text x="12" y="122" fontSize="11" fill="currentColor">crime (VARCHAR 100)</text>
              <text x="12" y="146" fontSize="11" fontWeight="bold" fill="#d97706">FK investigating_officer</text>
              <text x="12" y="170" fontSize="11" fill="currentColor">investigation_status (VARCHAR)</text>
              <text x="12" y="194" fontSize="10" fill="#64748b">Open | Active | Closed</text>
            </g>

            {/* Connection: CRIMINAL -> COURT_RECORD (1:1) */}
            <path
              d="M 570 65 L 680 65"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="625" y="57" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">1 : 1</text>

            {/* Entity 3: COURT_RECORD */}
            <g transform="translate(680, 20)">
              <rect width="210" height="110" rx="4" className="fill-slate-50 dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700 stroke-1" />
              <rect width="210" height="28" rx="4" className="fill-slate-800 dark:fill-slate-800" />
              <text x="105" y="19" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">COURT_RECORD</text>

              <text x="12" y="52" fontSize="11" fontWeight="bold" fill="#0284c7">PK court_room_number (INT)</text>
              <text x="12" y="78" fontSize="11" fontWeight="bold" fill="#d97706">FK criminal_id (INT)</text>
              <text x="12" y="98" fontSize="10" fill="#64748b">→ CRIMINAL.criminal_id</text>
            </g>

            {/* Connection: CRIMINAL -> JAIL (1:1 UNIQUE) */}
            <path
              d="M 570 170 L 680 200"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="625" y="180" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">1 : 1 (UNIQUE)</text>

            {/* Entity 4: JAIL */}
            <g transform="translate(680, 160)">
              <rect width="210" height="145" rx="4" className="fill-slate-50 dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700 stroke-1" />
              <rect width="210" height="28" rx="4" className="fill-slate-800 dark:fill-slate-800" />
              <text x="105" y="19" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">JAIL</text>

              <text x="12" y="52" fontSize="11" fill="currentColor">location (VARCHAR 100)</text>
              <text x="12" y="76" fontSize="11" fontWeight="bold" fill="#d97706">FK criminal_id (UNIQUE)</text>
              <text x="12" y="100" fontSize="11" fill="currentColor">barrack_number (VARCHAR 50)</text>
              <text x="12" y="124" fontSize="11" fill="currentColor">sentence (VARCHAR 50)</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Schema Notes & Requirements Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Info size={13} className="text-blue-600" />
            <span>MySQL 8 Reserved Word</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            <code className="text-blue-700 dark:text-blue-400 font-mono">`rank`</code> is a reserved window function keyword in MySQL 8.0+. It must always be enclosed in backticks in all SQL queries.
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Key size={13} className="text-amber-600" />
            <span>JAIL Unique Constraint</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            JAIL has no composite or surrogate PK declared in the project specification. <code className="font-mono text-amber-700 dark:text-amber-300">criminal_id</code> is marked UNIQUE so that each criminal has at most one jail record.
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Link2 size={13} className="text-emerald-600" />
            <span>Investigation Statuses</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            The status attribute is strictly validated against the three enumerated domains: <code className="font-mono text-emerald-700 dark:text-emerald-400">Open</code>, <code className="font-mono text-emerald-700 dark:text-emerald-400">Under Investigation</code>, and <code className="font-mono text-emerald-700 dark:text-emerald-400">Closed</code>.
          </p>
        </div>
      </div>

      {/* Table Specifications */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Entity Data Dictionary & Attributes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((t) => (
            <div
              key={t.name}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{t.description}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {t.columns.length} columns
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                      <th className="py-1">Column</th>
                      <th className="py-1">Type</th>
                      <th className="py-1">Key</th>
                      <th className="py-1">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                    {t.columns.map((c) => (
                      <tr key={c.name}>
                        <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">
                          {c.name}
                        </td>
                        <td className="py-1.5 text-slate-500">{c.type}</td>
                        <td className="py-1.5">
                          {c.isPK && (
                            <span className="px-1 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                              PK
                            </span>
                          )}
                          {c.isFK && (
                            <span className="px-1 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                              FK
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 text-slate-500 font-sans text-xs">{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DDL Schema Code Block */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Complete Schema DDL Script (db/schema.sql)
        </h3>
        <SqlBlock sql={rawSchemaSql} />
      </div>
    </div>
  );
};
