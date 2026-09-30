import React, { useState } from 'react';
import { Database, Key, Link2, Copy, Check, Info, FileText } from 'lucide-react';
import { SqlBlock } from '../components/common/SqlBlock';
import { PushPin } from '../components/common/PushPin';
import { Stamp } from '../components/common/Stamp';

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
      docketNumber: 'SCH-01',
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
      docketNumber: 'SCH-02',
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
      docketNumber: 'SCH-03',
      description: 'Judicial docket assignments mapping courtroom numbers to defendants',
      columns: [
        { name: 'court_room_number', type: 'INT', isPK: true, isFK: false, desc: 'Primary key judicial hearing chamber' },
        { name: 'criminal_id', type: 'INT', isPK: false, isFK: true, ref: 'CRIMINAL.criminal_id', desc: 'FK linking defendant to chamber' },
      ],
    },
    {
      name: 'JAIL',
      docketNumber: 'SCH-04',
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D2C2] dark:border-[#383C45]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-typewriter text-lg font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wide">
              Relational Database Schema & ER Architecture
            </h2>
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#E6DFCD] dark:bg-[#2C303A] text-[#1F1F1F] dark:text-[#E2DFD8] border border-[#D8D2C2] dark:border-[#383C45] font-semibold">
              MySQL 8.0 InnoDB
            </span>
          </div>
          <p className="font-typewriter text-xs text-[#6B685F] dark:text-[#A09D95] mt-1">
            4 normalized relational entities with enforced foreign keys, cascading constraints, and unique indices
          </p>
        </div>

        <button
          onClick={handleCopySchema}
          className="h-8 px-3 flex items-center gap-2 text-xs font-typewriter font-semibold border border-[#D8D2C2] dark:border-[#383C45] bg-[#FAF7F0] dark:bg-[#252830] text-[#1F1F1F] dark:text-[#E2DFD8] hover:border-[#B08D3C] hover:bg-[#EFE9DC] dark:hover:bg-[#2C303A] rounded-xs transition-fast shrink-0 shadow-xs"
        >
          {copied ? <Check size={13} className="text-[#386641]" /> : <Copy size={13} className="text-[#B08D3C]" />}
          <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY SCHEMA.SQL'}</span>
        </button>
      </div>

      {/* ER Diagram corkboard / manila board view */}
      <div className="relative p-5 bg-[#FAF7F0] dark:bg-[#1E2024] border-2 border-[#D8D2C2] dark:border-[#383C45] rounded-xs shadow-md space-y-4">
        {/* Board Pushpins */}
        <div className="absolute top-2 left-3">
          <PushPin color="brass" size={20} />
        </div>
        <div className="absolute top-2 right-3">
          <PushPin color="red" size={20} />
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C2] dark:border-[#383C45] pl-6 pr-6">
          <div className="flex items-center gap-2 text-xs font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
            <Database size={15} className="text-[#B08D3C]" />
            <span>Entity Relationship Diagram (ERD) — Bureau Blueprint</span>
          </div>
          <span className="font-mono text-[10px] text-[#7A7A7A] uppercase">
            Normalized 3NF Relational Model
          </span>
        </div>

        <div className="w-full overflow-x-auto py-2">
          <svg
            viewBox="0 0 920 320"
            className="w-full min-w-[760px] text-[#1F1F1F] dark:text-[#E2DFD8] select-none"
          >
            <defs>
              <marker
                id="erd-red-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#B3261E" />
              </marker>
              <marker
                id="erd-brass-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#B08D3C" />
              </marker>
            </defs>

            {/* Entity 1: POLICE */}
            <g transform="translate(30, 20)">
              <rect
                width="210"
                height="190"
                rx="2"
                fill="#F6F0E0"
                stroke="#D8D2C2"
                strokeWidth="1.5"
                className="dark:fill-[#252830] dark:stroke-[#383C45]"
              />
              <rect width="210" height="28" rx="2" fill="#1F2D3D" />
              <line x1="0" y1="28" x2="210" y2="28" stroke="#B08D3C" strokeWidth="1.5" />
              <text x="105" y="19" textAnchor="middle" fill="#FAF7F0" fontSize="12" fontFamily="monospace" fontWeight="bold">
                POLICE
              </text>
              
              <text x="12" y="50" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#B08D3C">
                [PK] police_id (INT)
              </text>
              <text x="12" y="72" fontSize="11" fontFamily="monospace" fill="currentColor">
                `rank` (VARCHAR 50)
              </text>
              <text x="12" y="94" fontSize="11" fontFamily="monospace" fill="currentColor">
                name (VARCHAR 100)
              </text>
              <text x="12" y="116" fontSize="11" fontFamily="monospace" fill="currentColor">
                branch (VARCHAR 100)
              </text>
              <text x="12" y="138" fontSize="11" fontFamily="monospace" fill="currentColor">
                age (INT)
              </text>
              <text x="12" y="160" fontSize="11" fontFamily="monospace" fill="currentColor">
                number (VARCHAR 20)
              </text>
              <text x="12" y="182" fontSize="11" fontFamily="monospace" fill="currentColor">
                address (VARCHAR 255)
              </text>
            </g>

            {/* Connection: POLICE -> CRIMINAL (1:N) */}
            <path
              d="M 240 70 L 350 70"
              fill="none"
              stroke="#B3261E"
              strokeWidth="2"
              markerEnd="url(#erd-red-arrow)"
            />
            <text x="295" y="62" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#B3261E" fontWeight="bold">
              1 : N (investigates)
            </text>

            {/* Entity 2: CRIMINAL */}
            <g transform="translate(350, 20)">
              <rect
                width="220"
                height="210"
                rx="2"
                fill="#F6F0E0"
                stroke="#D8D2C2"
                strokeWidth="1.5"
                className="dark:fill-[#252830] dark:stroke-[#383C45]"
              />
              <rect width="220" height="28" rx="2" fill="#1F2D3D" />
              <line x1="0" y1="28" x2="220" y2="28" stroke="#B08D3C" strokeWidth="1.5" />
              <text x="110" y="19" textAnchor="middle" fill="#FAF7F0" fontSize="12" fontFamily="monospace" fontWeight="bold">
                CRIMINAL
              </text>

              <text x="12" y="50" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#B08D3C">
                [PK] criminal_id (INT)
              </text>
              <text x="12" y="74" fontSize="11" fontFamily="monospace" fill="currentColor">
                name (VARCHAR 100)
              </text>
              <text x="12" y="98" fontSize="11" fontFamily="monospace" fill="currentColor">
                age (INT)
              </text>
              <text x="12" y="122" fontSize="11" fontFamily="monospace" fill="currentColor">
                crime (VARCHAR 100)
              </text>
              <text x="12" y="146" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#B3261E">
                [FK] investigating_officer
              </text>
              <text x="12" y="170" fontSize="11" fontFamily="monospace" fill="currentColor">
                investigation_status (VARCHAR)
              </text>
              <text x="12" y="194" fontSize="10" fontFamily="monospace" fill="#7A7A7A">
                Open | Under Invest. | Closed
              </text>
            </g>

            {/* Connection: CRIMINAL -> COURT_RECORD (1:1) */}
            <path
              d="M 570 65 L 680 65"
              fill="none"
              stroke="#B3261E"
              strokeWidth="2"
              markerEnd="url(#erd-red-arrow)"
            />
            <text x="625" y="57" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#B3261E" fontWeight="bold">
              1 : 1
            </text>

            {/* Entity 3: COURT_RECORD */}
            <g transform="translate(680, 20)">
              <rect
                width="210"
                height="115"
                rx="2"
                fill="#F6F0E0"
                stroke="#D8D2C2"
                strokeWidth="1.5"
                className="dark:fill-[#252830] dark:stroke-[#383C45]"
              />
              <rect width="210" height="28" rx="2" fill="#1F2D3D" />
              <line x1="0" y1="28" x2="210" y2="28" stroke="#B08D3C" strokeWidth="1.5" />
              <text x="105" y="19" textAnchor="middle" fill="#FAF7F0" fontSize="12" fontFamily="monospace" fontWeight="bold">
                COURT_RECORD
              </text>

              <text x="12" y="52" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#B08D3C">
                [PK] court_room_number (INT)
              </text>
              <text x="12" y="78" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#B3261E">
                [FK] criminal_id (INT)
              </text>
              <text x="12" y="100" fontSize="10" fontFamily="monospace" fill="#7A7A7A">
                → CRIMINAL.criminal_id
              </text>
            </g>

            {/* Connection: CRIMINAL -> JAIL (1:1 UNIQUE) */}
            <path
              d="M 570 170 L 680 200"
              fill="none"
              stroke="#B3261E"
              strokeWidth="2"
              markerEnd="url(#erd-red-arrow)"
            />
            <text x="625" y="180" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#B3261E" fontWeight="bold">
              1 : 1 (UNIQUE)
            </text>

            {/* Entity 4: JAIL */}
            <g transform="translate(680, 160)">
              <rect
                width="210"
                height="145"
                rx="2"
                fill="#F6F0E0"
                stroke="#D8D2C2"
                strokeWidth="1.5"
                className="dark:fill-[#252830] dark:stroke-[#383C45]"
              />
              <rect width="210" height="28" rx="2" fill="#1F2D3D" />
              <line x1="0" y1="28" x2="210" y2="28" stroke="#B08D3C" strokeWidth="1.5" />
              <text x="105" y="19" textAnchor="middle" fill="#FAF7F0" fontSize="12" fontFamily="monospace" fontWeight="bold">
                JAIL
              </text>

              <text x="12" y="52" fontSize="11" fontFamily="monospace" fill="currentColor">
                location (VARCHAR 100)
              </text>
              <text x="12" y="76" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#B3261E">
                [FK] criminal_id (UNIQUE)
              </text>
              <text x="12" y="100" fontSize="11" fontFamily="monospace" fill="currentColor">
                barrack_number (VARCHAR 50)
              </text>
              <text x="12" y="124" fontSize="11" fontFamily="monospace" fill="currentColor">
                sentence (VARCHAR 50)
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Schema Notes & Requirements Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-[#F6F0E0] dark:bg-[#1E2024] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
            <Info size={14} className="text-[#1F2D3D] dark:text-[#8C9AA8]" />
            <span>MySQL 8 Reserved Word</span>
          </div>
          <p className="font-typewriter text-[11px] text-[#6B685F] dark:text-[#A09D95] leading-relaxed">
            <code className="text-[#1F2D3D] dark:text-[#B08D3C] font-mono font-bold bg-[#E6DFCD] dark:bg-[#2C303A] px-1 py-0.5 rounded-xs">`rank`</code> is a reserved window function keyword in MySQL 8.0+. It must always be enclosed in backticks in all SQL queries.
          </p>
        </div>

        <div className="p-4 bg-[#F6F0E0] dark:bg-[#1E2024] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
            <Key size={14} className="text-[#B08D3C]" />
            <span>JAIL Unique Constraint</span>
          </div>
          <p className="font-typewriter text-[11px] text-[#6B685F] dark:text-[#A09D95] leading-relaxed">
            JAIL has no composite or surrogate PK declared in the project specification. <code className="font-mono text-[#B08D3C] font-bold bg-[#E6DFCD] dark:bg-[#2C303A] px-1 py-0.5 rounded-xs">criminal_id</code> is marked UNIQUE so that each criminal has at most one jail record.
          </p>
        </div>

        <div className="p-4 bg-[#F6F0E0] dark:bg-[#1E2024] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
            <Link2 size={14} className="text-[#386641]" />
            <span>Investigation Statuses</span>
          </div>
          <p className="font-typewriter text-[11px] text-[#6B685F] dark:text-[#A09D95] leading-relaxed">
            The status attribute is strictly validated against the three enumerated domains: <code className="font-mono text-[#386641] font-bold bg-[#E6DFCD] dark:bg-[#2C303A] px-1 py-0.5 rounded-xs">Open</code>, <code className="font-mono text-[#386641] font-bold bg-[#E6DFCD] dark:bg-[#2C303A] px-1 py-0.5 rounded-xs">Under Investigation</code>, and <code className="font-mono text-[#386641] font-bold bg-[#E6DFCD] dark:bg-[#2C303A] px-1 py-0.5 rounded-xs">Closed</code>.
          </p>
        </div>
      </div>

      {/* Table Specifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-[#D8D2C2] dark:border-[#383C45]">
          <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
            Entity Data Dictionary & Attributes
          </h3>
          <span className="font-mono text-[10px] text-[#7A7A7A] uppercase">
            4 Relational Tables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((t) => (
            <div
              key={t.name}
              className="bg-[#FAF7F0] dark:bg-[#1E2024] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C2] dark:border-[#383C45]">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8] text-sm">
                      {t.name}
                    </h4>
                    <span className="font-mono text-[10px] text-[#B08D3C] border border-[#B08D3C]/30 px-1 rounded-xs">
                      {t.docketNumber}
                    </span>
                  </div>
                  <p className="font-typewriter text-[11px] text-[#6B685F] dark:text-[#A09D95] mt-0.5">
                    {t.description}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-[#7A7A7A]">
                  {t.columns.length} cols
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#D8D2C2] dark:border-[#383C45] text-[10px] font-typewriter uppercase text-[#7A7A7A]">
                      <th className="py-1">Column</th>
                      <th className="py-1">Type</th>
                      <th className="py-1">Key</th>
                      <th className="py-1">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE9DC] dark:divide-[#2E323B] font-mono text-[11px]">
                    {t.columns.map((c) => (
                      <tr key={c.name}>
                        <td className="py-1.5 font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
                          {c.name}
                        </td>
                        <td className="py-1.5 text-[#6B685F] dark:text-[#A09D95]">{c.type}</td>
                        <td className="py-1.5">
                          {c.isPK && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] bg-[#B08D3C]/15 text-[#B08D3C] font-bold border border-[#B08D3C]/40">
                              PK
                            </span>
                          )}
                          {c.isFK && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] bg-[#B3261E]/15 text-[#B3261E] font-bold border border-[#B3261E]/40">
                              FK
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 font-sans text-xs text-[#6B685F] dark:text-[#A09D95]">
                          {c.desc}
                        </td>
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
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#B08D3C]" />
          <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
            Complete Schema DDL Script (db/schema.sql)
          </h3>
        </div>
        <SqlBlock sql={rawSchemaSql} />
      </div>
    </div>
  );
};
