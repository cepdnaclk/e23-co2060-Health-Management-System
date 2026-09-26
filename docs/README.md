---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: e23-co2060-Health-Management-System
title: Health Management System
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template, and add more information required for your own project"

<!-- Once you fill the index.json file inside /docs/data, please make sure the syntax is correct. (You can use this tool to identify syntax errors)

Please include the "correct" email address of your supervisors. (You can find them from https://people.ce.pdn.ac.lk/ )

Please include an appropriate cover page image ( cover_page.jpg ) and a thumbnail image ( thumbnail.jpg ) in the same folder as the index.json (i.e., /docs/data ). The cover page image must be cropped to 940×352 and the thumbnail image must be cropped to 640×360 . Use https://croppola.com/ for cropping and https://squoosh.app/ to reduce the file size.

If your followed all the given instructions correctly, your repository will be automatically added to the department's project web site (Update daily)

A HTML template integrated with the given GitHub repository templates, based on github.com/cepdnaclk/eYY-project-theme . If you like to remove this default theme and make your own web page, you can remove the file, docs/_config.yml and create the site using HTML. -->

# AI-Integrated Health Management System

---

## Team
-  E/23/100, Apurwa Fernando, [email](e23100@eng.pdn.ac.lk)
-  E/23/098, Ryan Fernando, [email](e23098@eng.pdn.ac.lk)
-  E/23/012, Dimal Alagiyawanna , [email](e23012@eng.pdn.ac.lk)
-  E/23/093, Kavidu Kalhara, [email](e23093@eng.pdn.ac.lk)

<!-- Image (photo/drawing of the final hardware) should be here -->

<!-- This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/) -->

<!-- ![Sample Image](./images/sample.png) -->

#### Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture)
3. [Software Designs](#software-designs)
4. [Testing](#testing)
5. [Conclusion](#conclusion)
6. [Links](#links)

## Introduction

[website](https://medicarehms.up.railway.app/)
Hospitals manage many daily tasks such as patient registration, appointments, medical reports, and doctor consultations. When these tasks are handled manually, it can cause delays, misplaced records, and poor communication between patients and hospital staff.

This project provides a web-based Health Management System to manage these tasks in one place. Patients can register, view appointments, update their profile, make payments, and view reports. Doctors can view appointments and patient details, while receptionists can create appointments and upload reports.

The system improves hospital workflow by reducing manual work, making patient data easier to access, and helping users complete healthcare tasks faster.


## Solution Architecture

The system uses a simple client-server architecture. The frontend is built using React, the backend is built using Node.js and Express.js, and the database is MySQL. The frontend communicates with the backend using REST APIs.


JWT authentication is used to protect user accounts and role-based access is used to separate patient, doctor, and receptionist functions. The database stores users, patient profiles, appointments, payments, and reports. The system also includes AI-assisted symptom analysis and hereditary risk support.

## Software Designs

The frontend has separate screens for the landing page, login/signup, patient workspace, doctor workspace, and receptionist workspace. React state is used to manage forms, login sessions, dashboard views, loading messages, and errors.

The backend is divided into route, controller, model, and middleware files. Routes receive API requests, controllers handle the main logic, models communicate with the database, and middleware checks authentication and user roles.

The database contains tables for users, patient profiles, appointments, and patient reports. Appointments include doctor name, patient ID, date/time, status, reason, and payment details. Reports are stored with the patient ID, file name, file type, uploaded user, and upload time.

The main user roles are:

- Patient: manage profile, view appointments, pay for appointments, view reports, and use health guidance features.
- Doctor: view appointments, view patient records, update patient details, and complete appointments.
- Receptionist: create/cancel appointments, view patients, and upload reports.

## Testing

The application was verified using a two-tiered testing methodology combining automated API integration checks with manual workflow validation.

### Automated Integration Tests
An automated Node.js integration test runner validates core server health, user identity management, state persistence, and LLM endpoints prior to compilation:

- **`PASS` Health Endpoint:** Confirms Express API and database availability.
- **`PASS` Patient Signup & Auth:** Validates JWT generation and session management.
- **`PASS` Profile Update & Persistence:** Verifies local/MySQL database state mutations.
- **`PASS` Public & Protected Symptom Chat:** Ensures public triage and authenticated Gemini AI routes respond cleanly.
- **`PASS` Wellness Advice:** Validates localized health recommendation array payloads.

### Production Build Verification
Frontend compilation is validated using Vite's production toolchain, compiling 70 React components into minified production assets in **2.13s** with zero syntax or import errors. Automated image optimization via `vite-plugin-image-optimizer` reduces static raster assets by up to **54%** to ensure fast loads over low-bandwidth clinical networks.

### Manual System Verification
Manual functional tests were conducted across user roles to verify:
- Patient signup, profile customization, and report viewing.
- Receptionist appointment scheduling, confirmation, and report uploading.
- Doctor diagnosis logging and clinical history access.
- Invalid input handling (missing fields, bad credentials, malformed files) with appropriate error handling.

## Conclusion

The project achieved a working Health Management System with patient, doctor, and receptionist access. It supports account management, appointments, payments, reports, patient records, and AI-assisted health guidance.

Future improvements include adding prescription management, lab technician access, real payment gateway support, notifications, stronger security, automated testing, and cloud deployment.

The system can be further developed into a commercial hospital management platform for small and medium healthcare centers after adding production-level security, data protection, backups, and compliance features.


## Links
- [website](https://medicarehms.up.railway.app/)
- [Project Repository](https://github.com/cepdnaclk/e23-co2060-Health-Management-System/tree/main)
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
