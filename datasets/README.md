# RogMitra Datasets Repository

This directory contains the clinical datasets used for developing, benchmarking, and evaluating the RogMitra pre-consultation case-taking and clinical note summarization pipeline.

---

## 1. Primary Corpus: Clinical Visit Note Summarization Corpus

The clinical dialogue and note generation components utilize the official Microsoft **Clinical Visit Note Summarization Corpus** (released under Creative Commons Attribution 4.0 International).

- **Source Repository:** `clinical_visit_note_summarization_corpus-main`
- **Location on Disk:** `datasets/clinical_dialogues/clinical_visit_note_summarization_corpus-main/clinical_visit_note_summarization_corpus-main/`
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Data Notices:**
  - Incorporates material from **MTSamples.COM** (`https://www.mtsamples.com`). In compliance with their distribution guidelines, credit is hereby given to MTSamples.com.
  - Developed with contributions from medical annotators and clinicians for research into reducing physician clinical documentation burden.

---

## 2. Directory Structure & Verified Files

### Subcollection A: MTS-Dialog Dataset
Location: `datasets/clinical_dialogues/clinical_visit_note_summarization_corpus-main/clinical_visit_note_summarization_corpus-main/data/mts-dialog/`

Contains doctor-patient dialogue snippets paired with clinical note section headers and text:

| File Name | Size (Bytes) | Row Count | Schema / Columns |
| :--- | :--- | :--- | :--- |
| `MTS_Dataset_TrainingSet.csv` | 1,030,814 | 1,201 | `ID`, `section_header`, `section_text`, `dialogue` |
| `MTS_Dataset_ValidationSet.csv` | 74,054 | 100 | `ID`, `section_header`, `section_text`, `dialogue` |
| `MTS_Dataset_Final_200_TestSet_1.csv` | 160,396 | 200 | `ID`, `section_header`, `section_text`, `dialogue` |
| `MTS_Dataset_Final_200_TestSet_2.csv` | 171,558 | 200 | `ID`, `section_header`, `section_text`, `dialogue` |
| **Total MTS-Dialog** | **1,436,822** | **1,701** | |

### Subcollection B: ACI-Bench Dataset (Challenge Data)
Location: `datasets/clinical_dialogues/clinical_visit_note_summarization_corpus-main/clinical_visit_note_summarization_corpus-main/data/aci-bench/challenge_data/`

Contains full visit dialogues paired with complete clinical notes (SOAP style) and metadata:

| File Name | Size (Bytes) | Row Count | Description |
| :--- | :--- | :--- | :--- |
| `train.csv` | 611,240 | 67 | Full encounter dialogues and clinical notes (Train) |
| `train_metadata.csv` | 5,443 | 67 | Encounter metadata (patient name, age, gender, complaint) |
| `valid.csv` | 177,400 | 20 | Validation encounters |
| `valid_metadata.csv` | 1,783 | 20 | Validation metadata |
| `clinicalnlp_taskB_test1.csv` | 349,998 | 40 | ClinicalNLP Challenge Task B Test Set 1 |
| `clinicalnlp_taskB_test1_metadata.csv` | 3,195 | 40 | Metadata for Task B Test Set 1 |
| `clinicalnlp_taskC_test2.csv` | 385,979 | 40 | ClinicalNLP Challenge Task C Test Set 2 |
| `clinicalnlp_taskC_test2_metadata.csv` | 3,423 | 40 | Metadata for Task C Test Set 2 |
| `clef_taskC_test3.csv` | 381,908 | 40 | CLEF Challenge Task C Test Set 3 |
| `clef_taskC_test3_metadata.csv` | 3,438 | 40 | Metadata for Task C Test Set 3 |

### Subcollection C: ACI-Bench Experiment Data
Location: `datasets/clinical_dialogues/clinical_visit_note_summarization_corpus-main/clinical_visit_note_summarization_corpus-main/data/aci-bench/src_experiment_data/`

Contains ASR system transcriptions (`aci_asr`, `virtscribe_asr`), corrected transcripts (`asrcorr`), and human transcriptions (`humantrans`) across test splits 1, 2, 3, train, and valid for speech robustness analysis.

---

## 3. RogMitra Datasets Subdirectories

Per the project design, the following subdirectories are established under `datasets/`:
- `datasets/clinical_dialogues/`: Contains the Microsoft MTS-Dialog and clinical encounter dialogue corpus.
- `datasets/aci_bench/`: Reserved for processed ACI-Bench benchmarking splits.
- `datasets/synthea/`: Reserved for generated synthetic patient profiles, medical records, and FHIR resource bundles.
- `datasets/synthetic_demo/`: Reserved for localized bilingual (Hindi + English) synthetic test cases and sample prescriptions for local demonstration.

---

## 4. Attribution & Legal Notices

```
Attribution 4.0 International (CC BY 4.0)
Dataset: Clinical Visit Note Summarization Corpus (MTS-Dialog & ACI-Bench)
Authors: Microsoft Corporation & Clinical Collaborators
MTSamples Credit: "Please feel free to print, share, link, and distribute any of the reports from our website.
Requirement: Credit given to https://www.mtsamples.com"
```

All data included in these subcollections consists of synthetic clinical encounters and transcribed annotations created for clinical documentation AI research. No real protected health information (PHI) is present.
