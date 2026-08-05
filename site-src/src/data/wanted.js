// The requested list: models Warren Labs most wants on the bench.
// Derived 2026-07-30 from the gaps in the 40-curve archive, which stops around 2014.
// P1 = get first. P2 = strong second wave. P3 = fills a real gap when convenient.
//
// NO IEMs (2026-08-05). The whole IEM group was removed, not deprioritised. An IEM's response is
// dominated by insertion depth and tip seal, and this bench is a pinna fixture with nothing to
// control either. Removing the pinna does not help: what is behind it is miniDSP's own chamber, not
// a standardized IEC 60318-4 coupler, so it would be a third baseline comparable to nothing --
// including our own headphone data, which a coupler could never share an axis with anyway (it has no
// pinna, so no ear gain through 2-8 kHz). If IEMs are ever wanted it is a real 711 coupler and a
// separate, separately-labelled corpus. See warren-labs/measurements/ACQUISITION.md §0.
export const WANTED = [
  {
    "name": "Modern reference / most-compared open backs",
    "items": [
      {
        "name": "Sennheiser HD 800 S",
        "pri": "P1",
        "why": "The single most-compared headphone above $1,000 and the default soundstage/imaging reference in every review that mentions staging."
      },
      {
        "name": "Sennheiser HD 560S",
        "pri": "P1",
        "why": "Probably the most-recommended sub-$200 open back of the last six years, and widely used as an informal near-neutral reference people EQ from."
      },
      {
        "name": "Sennheiser HD 490 Pro",
        "pri": "P1",
        "why": "Sennheiser's current pro open back, ships with two pad sets and a stated target, and is the model most often benchmarked in mixing/mastering roundups now."
      },
      {
        "name": "Sennheiser HD 660S2",
        "pri": "P2",
        "why": "The live 600-series flagship and the permanent subject of is it worth it over the HD 6XX."
      },
      {
        "name": "Audio-Technica ATH-R70xa",
        "pri": "P2",
        "why": "The R70x sat unusually high in Crinacle's list (A- tier, $350) for a cheap open back; the a revision is Audio-Technica's current professional reference and has noticeably thinner independent measurement coverage than the model it replaced."
      },
      {
        "name": "Focal Utopia (2022) + Focal Clear MG",
        "pri": "P2",
        "why": "The dynamic-driver counterweight to the planar-dominated top end."
      },
      {
        "name": "Beyerdynamic DT 1990 Pro MKII",
        "pri": "P2",
        "why": "Beyerdynamic's current open studio flagship on the new 30-ohm Tesla.45 driver, a genuine break from the archive's 250/600-ohm DT 880/DT 990 lineage, and the model that inherits their studio slot."
      }
    ]
  },
  {
    "name": "Current budget and midrange workhorses (what people actually buy)",
    "items": [
      {
        "name": "Drop Sennheiser HD 6XX",
        "pri": "P1",
        "why": "Almost certainly the most-owned audiophile headphone in existence, and it recirculates at $130\u2013170 constantly."
      },
      {
        "name": "HiFiMan HE400se",
        "pri": "P1",
        "why": "The ~$110 planar that is the default answer to what is my first planar."
      },
      {
        "name": "Philips SHP9500",
        "pri": "P2",
        "why": "The perennial sub-$100 open back recommendation, with a second life as a gaming/modding platform."
      },
      {
        "name": "Koss KPH40 Utility (and KPH30i)",
        "pri": "P2",
        "why": "The modern cult budget king that has largely displaced the Porta Pro in recommendations."
      },
      {
        "name": "AKG K612 Pro",
        "pri": "P2",
        "why": "The surviving cheap AKG open back and the practical successor to the archive's K701/K702."
      }
    ]
  },
  {
    "name": "Planars",
    "items": [
      {
        "name": "HiFiMan Sundara",
        "pri": "P1",
        "why": "The reference point for affordable planars, full stop."
      },
      {
        "name": "HiFiMan Edition XS",
        "pri": "P1",
        "why": "Probably the best-selling audiophile planar of the decade at its $250\u2013400 street price, and the most common Sundara or XS question in the hobby."
      },
      {
        "name": "HiFiMan Arya Organic",
        "pri": "P1",
        "why": "Routinely described as the best-measuring headphone per dollar at street price, and the anchor of the $800\u20131,600 tier."
      },
      {
        "name": "Audeze LCD-X (2021 revision)",
        "pri": "P1",
        "why": "The archive's LCD-X is the original; the 2021 revision is a different tuning and is the unit actually in working studios."
      },
      {
        "name": "Moondrop Para",
        "pri": "P2",
        "why": "The Chi-Fi planar that undercut HiFiMan on tuning at ~$340."
      },
      {
        "name": "Meze Empyrean II / Meze Poet",
        "pri": "P3",
        "why": "Meze has zero presence in the archive despite being one of the three high-end planar houses people actually shortlist."
      }
    ]
  },
    {
    "name": "Closed backs and studio staples of the current era",
    "items": [
      {
        "name": "AKG K371",
        "pri": "P1",
        "why": "The most-cited measures right and costs $150 headphone in existence, tuned to the Harman over-ear target and used as the closed-back benchmark in most modern comparisons."
      },
      {
        "name": "Beyerdynamic DT 770 Pro, current 80\u03a9 and 250\u03a9",
        "pri": "P1",
        "why": "The archive has the 600\u03a9 variant, which is discontinued."
      },
      {
        "name": "Sennheiser HD 620S",
        "pri": "P2",
        "why": "Sennheiser's new closed 600-series entry at ~$350, positioned directly against the DT 770 / M50x tier and generating a lot of closed HD 650?"
      },
      {
        "name": "Sony MDR-M1",
        "pri": "P2",
        "why": "Sony's actual modern successor to the MDR-7506 that the archive holds."
      },
      {
        "name": "Dan Clark Audio E3 (or Stealth)",
        "pri": "P2",
        "why": "DCA is absent from the archive entirely and is one of the two or three brands that define the modern closed high end."
      },
      {
        "name": "Sony WH-1000XM6 and Apple AirPods Max 2",
        "pri": "P2",
        "why": "The two products that most non-enthusiasts mean when they say headphones."
      }
    ]
  },
  {
    "name": "Genuinely contested or measurement-scarce",
    "items": [
      {
        "name": "Grado SR325x / Hemp / RS1x",
        "pri": "P1",
        "why": "The archive has five Grados, all pre-x-series."
      },
      {
        "name": "HiFiMan Susvara (and Susvara Unveiled)",
        "pri": "P2",
        "why": "The top-of-market reference, and one of the few headphones where 5128-vs-711 results are documented as behaving oddly relative to other models, including unusual low-frequency variance under imperfect seal."
      },
      {
        "name": "ZMF Caldera / Atrium, with the full pad set",
        "pri": "P2",
        "why": "ZMF has no third-party presence in the archive and comparatively little anywhere: the response is strongly pad-dependent, wood cups introduce unit variation, and the manufacturer publishes its own measurements."
      },
      {
        "name": "Stax SR-L700 MkII or SR-X9000 (plus energizer)",
        "pri": "P3",
        "why": "Electrostatics need a dedicated drive setup, so third-party data is thin and rarely comparable."
      },
      {
        "name": "RAAL 1995 Immanis / Magna",
        "pri": "P3",
        "why": "Ribbon drivers, very high hype-to-data ratio, and an unusual transformer-fed drive requirement."
      },
      {
        "name": "Shokz OpenRun Pro 2 (open-ear / bone conduction)",
        "pri": "P3",
        "why": "A fast-growing mass-market category with essentially no rigorous published measurement, partly because standard couplers do not apply cleanly."
      }
    ]
  }
];
