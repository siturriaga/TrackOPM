import React, { useState, useEffect, useCallback } from 'react';

// --- MOCK AI & DATA ---
// This data is now based on official FLDOE clarifications for 7th Grade Civics.
const allStandards = [
    // Strand: Civics and Government
    { id: 'SS.7.C.1.1', name: 'Enlightenment Ideas and the Founding Fathers' },
    { id: 'SS.7.C.1.2', name: 'Influential Historical Documents' },
    { id: 'SS.7.C.1.3', name: 'Colonial Grievances in the Declaration of Independence' },
    { id: 'SS.7.C.1.4', name: 'Preamble to the U.S. Constitution' },
    { id: 'SS.7.C.1.5', name: 'Types of Law' },
    { id: 'SS.7.C.1.6', name: 'Separation of Powers and Checks and Balances' },
    { id: 'SS.7.C.1.7', name: 'Structure and Function of the Three Branches' },
    { id: 'SS.7.C.1.8', name: 'Amending the U.S. Constitution' },
    { id: 'SS.7.C.1.9', name: 'Rule of Law' },
    
    // Strand: Roles, Rights, and Responsibilities of Citizens
    { id: 'SS.7.C.2.1', name: 'Citizenship and Naturalization' },
    { id: 'SS.7.C.2.2', name: 'Obligations and Responsibilities of Citizens' },
    { id: 'SS.7.C.2.4', name: 'Peaceful Protest and Individual Rights' },
    { id: 'SS.7.C.2.5', name: 'First Amendment Rights' },
    { id: 'SS.7.C.2.8', name: 'Analyzing Public Policy' },
    { id: 'SS.7.C.2.9', name: 'Sources of Law' },
    { id: 'SS.7.C.2.10', name: 'Federal and State Courts' },
    { id: 'SS.7.C.2.11', name: 'Trial Process' },

    // Strand: Government Policies and Political Processes
    { id: 'SS.7.C.3.1', name: 'Forms of Government' },
    { id: 'SS.7.C.3.2', name: 'Systems of Government' },
    { id: 'SS.7.C.3.3', name: 'Structure and Function of the U.S. Federal System' },
    { id: 'SS.7.C.3.4', name: 'Levels and Services of Government' },
    { id: 'SS.7.C.3.5', name: 'The U.S. Constitution and the States' },
    { id: 'SS.7.C.3.6', name: 'Structure of State Government' },
    { id: 'SS.7.C.3.7', name: 'Structure of Local Government' },
    { id: 'SS.7.C.3.13', name: 'Comparing Constitutions' },
    { id: 'SS.7.C.3.14', name: 'Functions of International Organizations' },

    // Strand: Civic and Political Participation
    { id: 'SS.7.C.4.1', name: 'Political Parties' },
    { id: 'SS.7.C.4.2', name: 'Qualifications for Political Office' },
    { id: 'SS.7.C.4.3', name: 'Impact of Media in Politics' },
];


const mockAiApi = {
    explainStandard: (standard) => {
        const explanations = {
           'SS.7.C.1.1': { title: "Standard SS.7.C.1.1 Explained", explanation: "This standard focuses on how Enlightenment ideas from thinkers like John Locke and Baron de Montesquieu influenced the Founding Fathers.", clarifications: ["Students will identify the key ideas of John Locke (natural rights: life, liberty, and property; the social contract).", "Students will identify the key ideas of Baron de Montesquieu (separation of powers).", "Students will recognize how these ideas are present in foundational U.S. documents like the Declaration of Independence and the U.S. Constitution."], example: "John Locke's idea of 'life, liberty, and property' as natural rights was directly adapted by Thomas Jefferson in the Declaration of Independence as 'Life, Liberty and the pursuit of Happiness'." },
           'SS.7.C.1.2': { title: "Standard SS.7.C.1.2 Explained", explanation: "This standard focuses on tracing the impact that key historical documents had on the American colonists' views of government.", clarifications: ["Students will identify the important ideas in the Magna Carta (e.g., limited government, rule of law, due process).", "Students will identify the ideas in the English Bill of Rights (e.g., limited monarchy, rights of the people).", "Students will understand the principles of the Mayflower Compact (e.g., self-government, rule of law).", "Students will recognize the arguments in Thomas Paine's \"Common Sense\" (e.g., independence, self-government)."], example: "The Magna Carta, by forcing the King of England to accept that his power was not absolute, introduced the concept of 'limited government', which heavily influenced the colonists." },
           'SS.7.C.1.3': { title: "Standard SS.7.C.1.3 Explained", explanation: "This standard is about describing how colonial grievances listed in the Declaration of Independence were addressed in the U.S. Constitution and the Bill of Rights.", clarifications: ["Students will identify colonial grievances like 'imposing taxes without our consent' and 'quartering large bodies of armed troops among us'.", "Students will connect these grievances to specific solutions in the Constitution and Bill of Rights (e.g., taxation power given to Congress, the Third Amendment protecting against quartering soldiers)."], example: "The grievance 'He has kept among us, in times of peace, Standing Armies without the Consent of our legislatures' was directly addressed by the 3rd Amendment to the U.S. Constitution." },
           'SS.7.C.1.4': { title: "Standard SS.7.C.1.4 Explained", explanation: "This standard requires an analysis of the ideas and purposes of the Preamble to the U.S. Constitution.", clarifications: ["Students will identify the six goals of government in the Preamble: form a more perfect union, establish justice, ensure domestic tranquility, provide for the common defense, promote the general welfare, and secure the blessings of liberty.", "Students will recognize that the Preamble defines the purpose of the U.S. Constitution."], example: "A real-world example of 'promoting the general Welfare' is the government funding public services like schools, roads, or the Food and Drug Administration (FDA)." },
           'SS.7.C.1.5': { title: "Standard SS.7.C.1.5 Explained", explanation: "This standard requires students to distinguish between different types of law.", clarifications: ["Students will be able to define and provide examples of constitutional, statutory, case, and common law."], example: "A Supreme Court ruling like *Brown v. Board of Education* is an example of case law, as it interprets the Constitution and sets a precedent that all other courts must follow." },
           'SS.7.C.1.6': { title: "Standard SS.7.C.1.6 Explained", explanation: "This standard covers the concepts of separation of powers and checks and balances as described in the U.S. Constitution.", clarifications: ["Students will explain the concept of separation of powers as dividing government into three branches: legislative, executive, and judicial.", "Students will describe the system of checks and balances, providing examples of how each branch can 'check' the power of the others (e.g., presidential veto, congressional override, judicial review)."], example: "When the President vetoes a bill passed by Congress, that is an example of the executive branch checking the legislative branch. If Congress then overrides the veto with a 2/3 vote, that is the legislative branch balancing that check." },
           'SS.7.C.1.7': { title: "Standard SS.7.C.1.7 Explained", explanation: "This standard requires students to describe the structure, function, and processes of the three branches of the federal government.", clarifications: ["Students will identify the structure and function of the legislative (Congress: House and Senate), executive (President, Vice President, departments), and judicial (Supreme Court and lower federal courts) branches.", "Students will understand key processes like how a bill becomes a law."], example: "The legislative branch (Congress) has the function of writing laws, the executive branch (President) is responsible for enforcing those laws, and the judicial branch (Supreme Court) interprets the laws." },
           'SS.7.C.1.8': { title: "Standard SS.7.C.1.8 Explained", explanation: "This standard focuses on the formal and informal methods of amending the U.S. Constitution.", clarifications: ["Students will identify the two formal methods for proposing amendments (by Congress with a 2/3 vote in both houses, or by a national convention called for by 2/3 of the states).", "Students will identify the two formal methods for ratifying amendments (by 3/4 of the state legislatures, or by conventions in 3/4 of the states).", "Students will recognize that informal methods, such as judicial interpretation and legislative action, can change how the Constitution is understood."], example: "The Equal Rights Amendment (ERA) was proposed by Congress but failed to be ratified by 3/4 of the state legislatures, so it did not become a formal amendment to the Constitution." },
           'SS.7.C.1.9': { title: "Standard SS.7.C.1.9 Explained", explanation: "This standard is about defining the concept of 'rule of law' and its influence on the U.S. system of government.", clarifications: ["Students will recognize that rule of law means everyone, including rulers and government officials, is subject to the law.", "Students will provide examples of how rule of law is reflected in the U.S. Constitution and legal system (e.g., the impeachment process, public trials)."], example: "When a president is impeached or a government official is investigated for a crime, it shows that even the most powerful people are not above the law. This is rule of law in action." },
           'SS.7.C.2.1': { title: "Standard SS.7.C.2.1 Explained", explanation: "This standard covers the definition of citizenship and the process of naturalization.", clarifications: ["Students will recognize the two main ways to become a U.S. citizen: by birth (law of soil, law of blood) or through naturalization.", "Students will identify the legal requirements for becoming a naturalized citizen (e.g., age, residency, good moral character, passing a civics test)."], example: "Someone born in another country to non-U.S. citizen parents can still become a citizen by completing the naturalization process, which includes an application, an interview, and a civics and English test." },
           'SS.7.C.2.2': { title: "Standard SS.7.C.2.2 Explained", explanation: "This standard requires students to evaluate the roles, rights, and responsibilities of U.S. citizens.", clarifications: ["Students will distinguish between obligations (things citizens MUST do, like paying taxes and serving on juries) and responsibilities (things citizens SHOULD do, like voting and volunteering).", "Students will understand that with rights come responsibilities."], example: "Paying taxes is an obligation required by law. Voting in an election is a responsibility of a good citizen, but it is not legally required." },
           'SS.7.C.2.4': { title: "Standard SS.7.C.2.4 Explained", explanation: "This standard covers the importance of peaceful assembly, petition, and association in American constitutional government.", clarifications: ["Students will recognize that the First Amendment protects the rights of individuals to peacefully assemble, petition the government for a redress of grievances, and freely associate with others.", "Students will evaluate the importance of these rights in a constitutional republic."], example: "The Civil Rights Movement used peaceful protests, marches, and boycotts to challenge segregation laws. This is a powerful example of citizens using their First Amendment rights to demand change." },
           'SS.7.C.2.5': { title: "Standard SS.7.C.2.5 Explained", explanation: "This standard distinguishes between the five freedoms protected by the First Amendment and their limitations.", clarifications: ["Students will identify the five freedoms: speech, press, religion, assembly, and petition.", "Students will understand that these freedoms are not absolute and can be limited (e.g., speech that incites violence is not protected)."], example: "While you have freedom of speech, you cannot falsely shout 'Fire!' in a crowded theater because it creates a clear and present danger to public safety. This is a limitation on that freedom." },
           'SS.7.C.2.8': { title: "Standard SS.7.C.2.8 Explained", explanation: "This standard requires students to identify the different ways individuals and groups can influence public policy.", clarifications: ["Students will identify methods such as lobbying, petitioning, running for office, and participating in interest groups.", "Students will analyze the impact of these methods on government decisions."], example: "An organization like Mothers Against Drunk Driving (MADD) successfully lobbied Congress to pass laws raising the national drinking age to 21, demonstrating how an interest group can change public policy." },
           'SS.7.C.2.11': { title: "Standard SS.7.C.2.11 Explained", explanation: "This standard covers the roles of various participants in the state and federal justice systems.", clarifications: ["Students will be able to distinguish between the roles of a judge, jury, prosecutor, and defense attorney in a trial.", "Students will understand the difference between civil and criminal trials."], example: "In a criminal trial, the prosecutor's job is to prove the defendant is guilty, while the defense attorney's job is to argue for their client's innocence. The jury's role is to listen to both sides and decide the facts of the case." },
           'SS.7.C.3.1': { title: "Standard SS.7.C.3.1 Explained", explanation: "This standard requires students to compare different forms of government.", clarifications: ["Students will compare direct democracy, representative democracy (republic), socialism, communism, monarchy, oligarchy, and autocracy.", "Students will be able to identify the key characteristics of each form of government."], example: "The United States is a representative democracy (republic) because citizens elect officials to make laws on their behalf, whereas in a direct democracy, citizens would vote on every single law themselves." },
           'SS.7.C.3.3': { title: "Standard SS.7.C.3.3 Explained", explanation: "This standard covers the structure and function of the U.S. system of government (federalism).", clarifications: ["Students will compare the powers of the federal government (delegated/enumerated powers) with the powers reserved for the states (reserved powers), and powers they share (concurrent powers).", "Students will provide examples for each type of power (e.g., Federal: declaring war; State: running schools; Concurrent: collecting taxes)."], example: "The power to print money is a delegated power belonging only to the federal government. The power to issue driver's licenses is a reserved power belonging to state governments." },
           'SS.7.C.3.4': { title: "Standard SS.7.C.3.4 Explained", explanation: "This standard requires students to identify the different levels of government and the services they provide.", clarifications: ["Students will identify the three levels of government: federal, state, and local.", "Students will provide examples of services provided by each level (e.g., Federal: disaster relief; State: highway patrol; Local: public libraries, trash collection)."], example: "Your local government is responsible for services like maintaining local parks and ensuring trash is collected, while the federal government is responsible for national defense and the postal service." },
           'SS.7.C.3.5': { title: "Standard SS.7.C.3.5 Explained", explanation: "This standard explains the constitutional amendment process and its application in the U.S. Constitution.", clarifications: ["Students will explain the relationship between the U.S. Constitution and state constitutions.", "Students will recognize the supremacy of the U.S. Constitution (the 'Supremacy Clause')."], example: "If a state passes a law that contradicts a federal law or the U.S. Constitution, the federal law or Constitution will prevail because of the Supremacy Clause." },
           'SS.7.C.4.1': { title: "Standard SS.7.C.4.1 Explained", explanation: "This standard focuses on the role and function of political parties in the United States.", clarifications: ["Students will identify the major political parties (Democratic and Republican) and their core beliefs.", "Students will describe the functions of political parties, such as nominating candidates, educating the public, and operating the government."], example: "During an election, the Republican and Democratic parties each select a candidate to run for president. This nominating function is a key role of political parties." },
           'SS.7.C.4.2': { title: "Standard SS.7.C.4.2 Explained", explanation: "This standard requires students to recognize the qualifications for holding state and federal political office.", clarifications: ["Students will identify the constitutional qualifications for President, U.S. Senator, and U.S. Representative.", "Students will identify the qualifications for Florida's state-level offices like Governor, State Senator, and State Representative."], example: "To be President of the United States, a person must be a natural-born citizen, at least 35 years old, and have been a resident of the U.S. for 14 years." },
           'SS.7.C.4.3': { title: "Standard SS.7.C.4.3 Explained", explanation: "This standard covers the impact of media, individuals, and interest groups on monitoring and influencing government.", clarifications: ["Students will identify how media acts as a 'watchdog' to monitor government actions.", "Students will describe how individuals and interest groups can influence public policy through lobbying, petitions, and public persuasion."], example: "An interest group like the Sierra Club might lobby members of Congress to pass laws that protect the environment. This is an example of a group influencing government." },
         };
        const standardInfo = allStandards.find(s => s.id === standard);
        return new Promise(res => setTimeout(() => res(explanations[standard] || { title: `Explanation for ${standard}`, explanation: `Details for ${standardInfo?.name || 'this standard'} are not yet available.`, clarifications: [], example: "N/A" }), 500));
    },
    generateLessonIdea: (standard) => {
        const ideas = {
           'SS.7.C.1.1': { title: "15-Min Mini-Lesson for SS.7.C.1.1", hook: "Ask students: 'If you were creating a new country, what is the #1 most important rule or right everyone should have?' List ideas and connect them to Locke's 'natural rights.'", activity: "Create a T-Chart. On one side, list 'John Locke' and on the other 'Montesquieu.' Have students fill in the key ideas for each thinker. Then, have them find one example of each idea in a simplified text of the Declaration of Independence or the Constitution." },
           'SS.7.C.1.2': { title: "15-Min Mini-Lesson for SS.7.C.1.2", hook: "Show a picture of a king and ask, 'What makes a ruler fair or unfair?' Discuss the concept of a ruler having to follow the rules, which introduces 'rule of law' and 'limited government'.", activity: "Create a four-column chart on the board for Magna Carta, English Bill of Rights, Mayflower Compact, and Common Sense. As a class, fill in the key ideas from each that the colonists would have valued." },
        };
        const standardInfo = allStandards.find(s => s.id === standard);
        return new Promise(res => setTimeout(() => res(ideas[standard] || { title: `Lesson Idea for ${standard}`, hook: `Brainstorm activity related to ${standardInfo?.name || 'this topic'}.`, activity: "Think-Pair-Share activity where students discuss the main concepts." }), 500));
    },
    generateAssignment: (standard, difficulty, assignmentType) => {
        // --- MULTIPLE CHOICE QUIZ DATA (EXPANDED) ---
        const mcq = {
           'SS.7.C.1.1': {
                remedial: [{ id: 1, question: "Who came up with the idea of 'life, liberty, and property'?", options: ["Baron de Montesquieu", "John Locke", "King George III"], answer: "John Locke" }],
                onGradeLevel: [{ id: 1, question: "The concept of 'separation of powers' in the U.S. Constitution was influenced by which Enlightenment thinker?", options: ["Thomas Paine", "John Locke", "Baron de Montesquieu"], answer: "Baron de Montesquieu" }],
                advanced: [{ id: 1, question: "How does the 'social contract' theory, as described by John Locke, relate to the Declaration of Independence?", options: ["It argues for a king's divine right to rule.", "It states that government's legitimacy comes from the consent of the governed.", "It demands that all property be shared equally among citizens."], answer: "It states that government's legitimacy comes from the consent of the governed." }]
            },
           'SS.7.C.1.2': {
                remedial: [{ id: 1, question: "Which document was an agreement made by the Pilgrims for self-government?", options: ["Magna Carta", "Common Sense", "Mayflower Compact"], answer: "Mayflower Compact" }],
                onGradeLevel: [{ id: 1, question: "What was the main argument of Thomas Paine's pamphlet, 'Common Sense'?", options: ["The colonies should reconcile with Great Britain.", "The colonies should declare independence.", "The colonies should elect a king."], answer: "The colonies should declare independence." }],
                advanced: [{ id: 1, question: "How did the English Bill of Rights influence the U.S. Bill of Rights?", options: ["It was copied word-for-word.", "It provided a model for protecting individual liberties, such as the right to bear arms and freedom from cruel and unusual punishment.", "It established the principle of federalism, which divides power between state and national governments."], answer: "It provided a model for protecting individual liberties, such as the right to bear arms and freedom from cruel and unusual punishment." }]
            },
           'SS.7.C.1.4': {
                remedial: [{ id: 1, question: "Which phrase in the Preamble means to make sure there is peace and quiet at home?", options: ["Establish Justice", "Ensure domestic Tranquility", "Provide for the common defense"], answer: "Ensure domestic Tranquility" }],
                onGradeLevel: [{ id: 1, question: "According to the Preamble, where does the power of the government come from?", options: ["The King", "The President", "We the People"], answer: "We the People" }],
                advanced: [{ id: 1, question: "How does the goal to 'form a more perfect Union' reflect a weakness of the Articles of Confederation?", options: ["The Articles created too strong of a central government.", "The Articles created a loose alliance of states with a weak central government.", "The Articles did not allow for a military."], answer: "The Articles created a loose alliance of states with a weak central government." }]
            },
            'SS.7.C.1.6': {
                remedial: [ { id: 1, question: "How many branches are in the U.S. government?", options: ["Two", "Three", "Four"], answer: "Three" }, { id: 2, question: "Which branch makes the laws?", options: ["Executive", "Judicial", "Legislative"], answer: "Legislative" }, ],
                onGradeLevel: [ { id: 1, question: "When the President vetoes a bill, which branch is checking which branch?", options: ["Legislative checks Executive", "Executive checks Legislative", "Judicial checks Executive"], answer: "Executive checks Legislative" }, { id: 2, question: "The power of judicial review allows the Supreme Court to:", options: ["Appoint new judges", "Declare laws unconstitutional", "Write new amendments"], answer: "Declare laws unconstitutional" }, ],
                advanced: [ { id: 1, question: "Which constitutional principle is best demonstrated by the President's cabinet being subject to the approval of the Senate?", options: ["Federalism", "Separation of Powers", "Checks and Balances"], answer: "Checks and Balances" }, { id: 2, question: "If Congress were to pass a law clearly violating the First Amendment, which check would be the most direct and final remedy?", options: ["A presidential veto", "A public petition", "Judicial review by the Supreme Court"], answer: "Judicial review by the Supreme Court" }, ]
            },
            'SS.7.C.1.9': {
                remedial: [ { id: 1, question: "Rule of law means that:", options: ["The president makes all the laws", "Only citizens have to follow laws", "Everyone must follow the law, even leaders"], answer: "Everyone must follow the law, even leaders" }, ],
                onGradeLevel: [ { id: 1, question: "Which of the following is the best example of the rule of law?", options: ["The President issuing an executive order", "A police officer getting a speeding ticket", "A king passing a new tax"], answer: "A police officer getting a speeding ticket" }, ],
                advanced: [ { id: 1, question: "How does the U.S. Constitution establish the principle of 'rule of law'?", options: ["By giving all power to a single leader", "By stating that government officials are exempt from laws", "By creating a system of checks and balances and requiring officials to take an oath to uphold it"], answer: "By creating a system of checks and balances and requiring officials to take an oath to uphold it" }, ],
            },
            'SS.7.C.2.1': {
                remedial: [ { id: 1, question: "What is one way a person can become a U.S. citizen?", options: ["By visiting the U.S.", "By being born in the U.S.", "By voting in an election"], answer: "By being born in the U.S." } ],
                onGradeLevel: [ { id: 1, question: "The 'law of soil' means that a person is a citizen because they were:", options: ["Born to U.S. citizen parents", "Born on U.S. territory", "Naturalized in the U.S."], answer: "Born on U.S. territory" }, ],
                advanced: [ { id: 1, question: "Which of the following is NOT a requirement for the naturalization process?", options: ["Demonstrating knowledge of U.S. civics", "Being a resident for a specific period", "Being born to U.S. citizen parents"], answer: "Being born to U.S. citizen parents" } ],
            },
            'SS.7.C.2.2': {
                remedial: [ { id: 1, question: "Which of these is something a citizen MUST do?", options: ["Vote", "Pay taxes", "Volunteer"], answer: "Pay taxes" } ],
                onGradeLevel: [ { id: 1, question: "What is the difference between an obligation and a responsibility of citizenship?", options: ["Obligations are required by law; responsibilities are voluntary.", "Responsibilities are required by law; obligations are voluntary.", "There is no difference."], answer: "Obligations are required by law; responsibilities are voluntary." } ],
                advanced: [ { id: 1, question: "Why is voting considered a key responsibility of citizenship in a democratic republic?", options: ["It is the primary way citizens hold their elected officials accountable.", "It is required in order to receive government services.", "It guarantees that the political party you support will win."], answer: "It is the primary way citizens hold their elected officials accountable." } ],
            },
        };

        // --- MATCHING ACTIVITY DATA (EXPANDED) ---
        const matching = {
           'SS.7.C.1.7': {
                remedial: { terms: ["President", "Congress", "Supreme Court"], definitions: ["Enforces the laws", "Makes the laws", "Interprets the laws"] },
                onGradeLevel: { terms: ["Cabinet", "House of Representatives", "Senate", "Judicial Review"], definitions: ["Advisors to the President", "Part of Congress based on population", "Part of Congress with two members from each state", "Power to declare laws unconstitutional"] },
                advanced: { terms: ["Expressed Powers", "Implied Powers", "Jurisdiction", "Bicameral"], definitions: ["Powers written directly in the Constitution", "Powers not stated but suggested by the 'necessary and proper' clause", "The official power to make legal decisions and judgments", "A legislature consisting of two parts, or houses"] }
            },
           'SS.7.C.3.1': {
                remedial: { terms: ["Democracy", "Monarchy", "Autocracy"], definitions: ["Ruled by the people", "Ruled by a king or queen", "Ruled by one person with total power"] },
                onGradeLevel: { terms: ["Republic", "Oligarchy", "Communism", "Socialism"], definitions: ["A government where citizens elect representatives", "A government ruled by a small group of people", "A system where the government controls all economic and political aspects", "A system where the community owns and regulates production and exchange"] },
                advanced: { terms: ["Direct Democracy", "Representative Democracy", "Theocracy", "Anarchy"], definitions: ["Citizens vote on all laws and decisions directly.", "Citizens elect officials to make laws on their behalf.", "A system of government in which priests rule in the name of God or a god.", "A state of disorder due to absence or nonrecognition of authority."] }
            },
           'SS.7.C.3.3': {
                remedial: { terms: ["Federal Government", "State Government", "Shared Power"], definitions: ["In charge of the whole country", "In charge of one state", "Something both federal and state governments can do, like tax"] },
                onGradeLevel: { terms: ["Delegated Powers", "Reserved Powers", "Concurrent Powers"], definitions: ["Powers given only to the federal government (e.g., declare war)", "Powers kept by the state governments (e.g., set up schools)", "Powers shared by federal and state governments (e.g., borrow money)"] },
            },
           'SS.7.C.3.4': {
                remedial: { terms: ["Federal", "State", "Local"], definitions: ["In charge of the whole country (e.g., mail)", "In charge of one state (e.g., driver's licenses)", "In charge of one city or town (e.g., fire department)"] },
                onGradeLevel: { terms: ["National Defense", "Public Schools", "Trash Collection", "Highway Patrol"], definitions: ["A service of the Federal government", "A service of the State/Local government", "A service of the Local government", "A service of the State government"] },
            }
        };

        // --- TDQ DATA (EXPANDED) ---
        const tdq = {
           'SS.7.C.2.4': {
                onGradeLevel: { text: "The First Amendment protects 'the right of the people peaceably to assemble.' Throughout American history, citizens have used this right to protest and demand change. For example, during the Civil Rights Movement, activists organized marches, sit-ins, and boycotts to challenge segregation laws. These assemblies were often met with resistance, but their peaceful nature was a key element protected by the Constitution.", questions: ["According to the text, what word in the First Amendment is critical to the right to assemble?", "How did Civil Rights activists use their right to assemble to challenge laws?"] }
            },
           'SS.7.C.2.5': {
                remedial: { text: "The First Amendment says 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.'", questions: ["List two freedoms mentioned in the text.", "According to the text, who is not allowed to take away these freedoms?"] },
                onGradeLevel: { text: "The First Amendment guarantees five basic freedoms. However, these rights are not absolute. For example, the freedom of speech does not protect speech that incites violence or is slanderous (false spoken statements that damage someone's reputation). The right to assemble is protected, but it must be peaceful.", questions: ["According to the text, what is one example of a limit on the freedom of speech?", "Why is it important for the right to assemble to be 'peaceful'?"] },
                advanced: { text: "In the landmark Supreme Court case *Tinker v. Des Moines* (1969), the court ruled that students did not 'shed their constitutional rights to freedom of speech or expression at the schoolhouse gate.' Students had worn black armbands to protest the Vietnam War, and the school suspended them. The Court sided with the students, as their symbolic speech was not disruptive to the educational environment.", questions: ["How did the Supreme Court's ruling in *Tinker v. Des Moines* apply the First Amendment to students in school?", "Based on the text, under what circumstances might the school have been justified in limiting the students' speech?"] }
            },
           'SS.7.C.4.1': {
                onGradeLevel: { text: "Political parties play a key role in U.S. government. Their main functions are to nominate candidates for office, inform the public about issues, and act as a 'watchdog' over the party in power. The two major parties are the Democrats and the Republicans.", questions: ["According to the text, what are two functions of political parties?", "What does it mean for a party to act as a 'watchdog'?"] },
            }
        };

        // --- CER DATA (EXPANDED) ---
        const cer = {
            'SS.7.C.1.3': {
                prompt: "Read the colonial grievance from the Declaration of Independence: 'For imposing Taxes on us without our Consent.' Which of the following statements provides the best claim, evidence, and reasoning to explain how the U.S. Constitution addressed this issue?",
                responses: [
                    { claim: "The Constitution fixed the tax problem by giving the President the power to tax.", evidence: "The evidence is that the executive branch is very powerful.", reasoning: "This is fair because the President is elected by all the people.", correct: false },
                    { claim: "The Constitution addressed 'taxation without consent' by granting the power to tax exclusively to Congress, whose members are elected by the people.", evidence: "Article I, Section 8 of the Constitution states, 'The Congress shall have Power To lay and collect Taxes...'", reasoning: "This ensures that the people have a voice in taxation through their elected representatives, directly resolving the grievance of being taxed by a government in which they had no representation.", correct: true },
                    { claim: "The Constitution solved the tax grievance by allowing states to reject federal taxes.", evidence: "The 10th Amendment reserves powers to the states.", reasoning: "If a state doesn't like a tax, it can just ignore it, which is a form of consent.", correct: false },
                ]
            },
            'SS.7.C.3.5': {
                prompt: "The U.S. Constitution contains the 'Supremacy Clause' in Article VI. Which of the following CERs best explains the purpose and effect of this clause?",
                responses: [
                    { claim: "The Supremacy Clause means that state laws are always more powerful than federal laws.", evidence: "The 10th Amendment gives powers to the states.", reasoning: "Therefore, states can choose to ignore any federal law they disagree with.", correct: false },
                    { claim: "The Supremacy Clause establishes that the U.S. Constitution and federal laws are the 'supreme Law of the Land.'", evidence: "Article VI states that the Constitution and federal laws 'shall be the supreme Law of the Land; and the Judges in every State shall be bound thereby...'", reasoning: "This means that if a state law conflicts with a federal law or the Constitution, the federal law or Constitution prevails, ensuring a unified legal system.", correct: true },
                    { claim: "The Supremacy Clause only applies during times of war.", evidence: "The President is Commander-in-Chief.", reasoning: "This gives the federal government supreme power when the country is at war.", correct: false }
                ]
            }
        };

        let assignmentData = {};
        
        // This logic ensures that if a specific type/difficulty isn't available, it provides a generic fallback.
        const getAssignmentData = (type, standard, difficulty) => {
            switch (type) {
                case 'Matching Activity': return matching[standard]?.[difficulty] || { terms: [`No ${difficulty} data`], definitions: [`No matching activity for this standard/difficulty yet.`] };
                case 'Text-Dependent Questions (TDQs)': return tdq[standard]?.[difficulty] || { text: 'Not available.', questions: [`No ${difficulty} TDQs for this standard/difficulty yet.`] };
                case 'Choose Best CER Response': return cer[standard] || { prompt: `No CER activity for ${standard} yet.`, responses: [] };
                case 'Multiple Choice Quiz':
                default: return mcq[standard]?.[difficulty] || [{ id: 1, question: `No ${difficulty} quiz for ${standard} yet.`, options: ["OK"], answer: "OK" }];
            }
        };

        assignmentData = getAssignmentData(assignmentType, standard, difficulty);

        return new Promise(res => setTimeout(() => res({ type: assignmentType, data: assignmentData }), 800));
    }
};

// --- HELPER COMPONENTS ---

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.681 4.048 4.448.648c.839.122 1.171 1.156.57 1.743l-3.218 3.134.758 4.432c.14.821-.723 1.458-1.464 1.093L10 15.175l-3.972 2.088c-.741.365-1.603-.272-1.464-1.093l.758-4.432-3.218-3.134a1.001 1.001 0 0 1 .57-1.743l4.448-.648L9.132 2.884Z" clipRule="evenodd" />
    </svg>
);

const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-fade-in-up">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <Icon path="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" className="w-6 h-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    </div>
);

// --- MAIN TABS / COMPONENTS ---

function StudentRoster({ setStudents, isXlsxReady }) {
    const [students, setLocalStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!isXlsxReady || !window.XLSX) {
           setError("Spreadsheet library is not available. Please wait a moment and try again.");
            return;
        };

        setIsLoading(true);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet);

                // Simulate AI processing and data cleaning
                const processedStudents = json.map((row, index) => {
                    const studentId = row['Student ID'] || `S${1001 + index}`;
                    const studentName = row['Student Name'] || 'Unknown Student';
                    
                    const scores = Object.keys(row)
                        .filter(key => key.startsWith('SS.'))
                        .map(standard => {
                            const score = parseInt(row[standard], 10);
                            const status = score >= 70 ? 'Mastered' : score >= 50 ? 'Approaching' : 'Needs Remediation';
                            return { standard, score, status, history: [{ type: 'Benchmark', score }] };
                        });
                    
                    return { id: studentId, name: studentName, scores };
                });
                
                setTimeout(() => { // Simulate processing time
                    setLocalStudents(processedStudents);
                    setStudents(processedStudents); // Update parent state
                    setIsLoading(false);
                }, 1500);

            } catch (err) {
                console.error("File processing error:", err);
                setError('Failed to process the spreadsheet. Please ensure it has columns for "Student Name", "Student ID", and standards (e.g., "SS.7.C.1.4").');
                setIsLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const getRemediationSummary = (scores) => {
        const remediationNeeded = scores.filter(s => s.status === 'Needs Remediation');
        if (remediationNeeded.length === 0) return <span className="text-green-600 font-medium">All standards mastered!</span>;
        return (
            <span className="text-red-600 font-medium">
                {`${remediationNeeded.length} standard${remediationNeeded.length > 1 ? 's' : ''} need remediation`}
            </span>
        );
    };

    const UploadButton = () => (
        <label htmlFor="file-upload" className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-all ${isXlsxReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'}`}>
            <Icon path="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" className="w-5 h-5"/>
            <span>{isXlsxReady ? 'Upload Student Report(s)' : 'Loading Tool...'}</span>
        </label>
    );

    return (
        <div className="animate-fade-in">
            <div className="p-6 bg-white rounded-2xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Student Roster</h2>
                        <p className="text-gray-600 mt-1">Upload your benchmark scores to populate the roster.</p>
                    </div>
                    <UploadButton/>
                    <input id="file-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={!isXlsxReady} />
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-10">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
                                <p className="text-gray-600 mt-4 font-semibold">AI is analyzing your spreadsheet...</p>
                        </div>
                    ) : students.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Remediation Summary</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getRemediationSummary(student.scores)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
                            <Icon path="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" className="mx-auto h-12 w-12 text-gray-400"/>
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">No student data</h3>
                            <p className="mt-1 text-sm text-gray-500">Upload a report to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AssignmentGenerator({ students, setStudents }) {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStandard, setSelectedStandard] = useState('');
    const [assignmentType, setAssignmentType] = useState('Multiple Choice Quiz');
    const [difficulty, setDifficulty] = useState('On Grade Level');
    
    const [modalContent, setModalContent] = useState(null);
    const [isLoading, setIsLoading] = useState({ explain: false, lesson: false, assignment: false });
    const [generatedAssignment, setGeneratedAssignment] = useState(null);
    const [assignmentScore, setAssignmentScore] = useState('');

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const handleExplain = async () => {
        if (!selectedStandard) return;
        setIsLoading(prev => ({ ...prev, explain: true }));
        const content = await mockAiApi.explainStandard(selectedStandard);
        setModalContent(content);
        setIsLoading(prev => ({ ...prev, explain: false }));
    };
    
    const handleLessonIdea = async () => {
        if (!selectedStandard) return;
        setIsLoading(prev => ({ ...prev, lesson: true }));
        const content = await mockAiApi.generateLessonIdea(selectedStandard);
        setModalContent(content);
        setIsLoading(prev => ({ ...prev, lesson: false }));
    };

    const handleGenerateAssignment = async () => {
        if (!selectedStandard) return;
        setGeneratedAssignment(null);
        setAssignmentScore('');
        setIsLoading(prev => ({...prev, assignment: true}));
        const assignment = await mockAiApi.generateAssignment(selectedStandard, difficulty.replace(/ /g, ''), assignmentType);
        setGeneratedAssignment(assignment);
        setIsLoading(prev => ({...prev, assignment: false}));
    };

    const handleSaveScore = () => {
        if (!selectedStudentId) {
            // This case should ideally not be reachable if the UI is disabled, but as a safeguard:
            const modal = {
                title: "Cannot Save Score",
                explanation: "Please select a student from the dropdown menu before saving a score.",
                clarifications: [],
                example: "Saving a score links the assignment result to a specific student's progress report."
            };
            setModalContent(modal);
            return;
        }
        const scoreValue = parseInt(assignmentScore, 10);
        if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
            const modal = {
                title: "Invalid Score",
                explanation: "Please enter a valid score between 0 and 100.",
                clarifications: [],
                example: "A valid score could be 85, 72, or 99."
            };
            setModalContent(modal);
            return;
        }

        const updatedStudents = students.map(student => {
            if (student.id === selectedStudentId) {
                const newScores = [...student.scores];
                const existingScoreIndex = newScores.findIndex(s => s.standard === selectedStandard);

                const newHistoryEntry = { type: `Remediation (${assignmentType})`, score: scoreValue };

                if (existingScoreIndex > -1) {
                    newScores[existingScoreIndex] = {
                        ...newScores[existingScoreIndex],
                        score: scoreValue,
                        status: scoreValue >= 70 ? 'Mastered' : scoreValue >= 50 ? 'Approaching' : 'Needs Remediation',
                        history: [...newScores[existingScoreIndex].history, newHistoryEntry]
                    };
                } else {
                     newScores.push({
                        standard: selectedStandard,
                        score: scoreValue,
                        status: scoreValue >= 70 ? 'Mastered' : scoreValue >= 50 ? 'Approaching' : 'Needs Remediation',
                        history: [newHistoryEntry]
                    });
                }
                return { ...student, scores: newScores };
            }
            return student;
        });
        setStudents(updatedStudents);
        setGeneratedAssignment(null);
    };
    
    const getStudentStandardStatus = (standardId) => {
        if (!selectedStudent) return '';
        const standard = selectedStudent.scores.find(s => s.standard === standardId);
        return standard ? `(${standard.status})` : '(Not Assessed)';
    };

    const handlePrint = () => {
        window.print();
    };
    
    const renderGeneratedAssignment = () => {
        if (!generatedAssignment) return null;
        
        const { type, data } = generatedAssignment;

        // Centralized handler for empty data
        const isEmptyData = () => {
            if (!data) return true;
            if (type === 'Multiple Choice Quiz' && (!data[0] || data[0].question.startsWith('No '))) return true;
            if (type === 'Matching Activity' && (!data.terms || data.terms[0].startsWith('No '))) return true;
            if (type === 'Text-Dependent Questions (TDQs)' && (!data.questions || data.questions[0].startsWith('No '))) return true;
            if (type === 'Choose Best CER Response' && (!data.responses || data.responses.length === 0)) return true;
            return false;
        };

        if (isEmptyData()) {
            return (
                 <div className="text-center py-10 px-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" className="mx-auto h-12 w-12 text-yellow-400"/>
                    <h3 className="mt-2 text-sm font-semibold text-yellow-900">Content Not Available</h3>
                    <p className="mt-1 text-sm text-yellow-600">The AI does not have this specific assignment type and difficulty for the selected standard yet.</p>
                </div>
            )
        }


        switch(type) {
            case 'Multiple Choice Quiz':
                return (
                    <div className="mt-4 space-y-6">
                        {data.map((item, index) => (
                            <div key={item.id}>
                                <p className="font-semibold text-gray-800">{index + 1}. {item.question}</p>
                                <div className="mt-2 space-y-2 pl-4">
                                    {item.options.map(option => (
                                        <label key={option} className="flex items-center">
                                            <input type="radio" name={`q${item.id}`} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"/>
                                            <span className="ml-3 text-gray-700">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'Matching Activity':
                const shuffledDefinitions = [...data.definitions].sort(() => Math.random() - 0.5);
                return (
                    <div className="mt-4">
                        <p className="text-gray-700 mb-4">Instructions: Match each term on the left with the correct definition on the right.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 border-b pb-1">Terms</h4>
                                {data.terms.map((term, index) => (
                                    <p key={index} className="font-semibold p-2 bg-gray-50 rounded-md">{index + 1}. {term}</p>
                                ))}
                            </div>
                             <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 border-b pb-1">Definitions</h4>
                                {shuffledDefinitions.map((def, index) => (
                                    <p key={index} className="p-2 bg-gray-50 rounded-md">
                                        <span className="font-mono mr-2 text-indigo-600">___</span> {def}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'Text-Dependent Questions (TDQs)':
                return (
                    <div className="mt-4 space-y-4">
                        <p className="font-semibold text-gray-800">Read the following text and answer the questions below.</p>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 italic leading-relaxed">
                            {data.text}
                        </div>
                        {data.questions.map((q, index) => (
                            <div key={index}>
                                <label className="font-semibold text-gray-800 block mb-2">{index + 1}. {q}</label>
                                <textarea className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" rows="3" placeholder="Type your answer here..."></textarea>
                            </div>
                        ))}
                    </div>
                );
            case 'Choose Best CER Response':
                return (
                    <div className="mt-4 space-y-4">
                        <p className="font-semibold text-gray-800">{data.prompt}</p>
                        <div className="space-y-4">
                            {data.responses.map((resp, index) => (
                                <div key={index} className={`p-4 border rounded-lg ${resp.correct ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                                    <label className="flex items-start">
                                        <input type="radio" name="cer-response" className="mt-1 focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"/>
                                        <div className="ml-3 text-sm">
                                            <p><span className="font-bold text-gray-900">Claim:</span> {resp.claim}</p>
                                            <p className="mt-1"><span className="font-bold text-gray-900">Evidence:</span> {resp.evidence}</p>
                                            <p className="mt-1"><span className="font-bold text-gray-900">Reasoning:</span> {resp.reasoning}</p>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <p className="mt-4 text-red-500">Error: Unknown assignment type.</p>;
        }
    };


    return (
        <div className="animate-fade-in space-y-6">
            <div className="p-6 bg-white rounded-2xl shadow-md printable-content">
                <h2 className="text-2xl font-bold text-gray-800">Assignment Generator</h2>
                <p className="text-gray-600 mt-1">Create targeted assignments for individual students or practice quizzes for a standard.</p>

                {/* --- Step 1 & 2: Selections & Analysis --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-b border-gray-200 pb-6 no-print">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">Select Student (Optional)</label>
                            <select id="student-select" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                <option value="">-- No Student Selected --</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="standard-select" className="block text-sm font-medium text-gray-700 mb-1">Civics Standard</label>
                            <select id="standard-select" value={selectedStandard} onChange={e => setSelectedStandard(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                <option value="">-- Select a Standard --</option>
                               {allStandards.map(s => <option key={s.id} value={s.id}>{s.id}: {s.name} {getStudentStandardStatus(s.id)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-3">
                        <button onClick={handleExplain} disabled={!selectedStandard || isLoading.explain} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-100 text-sky-800 font-semibold rounded-lg shadow-sm hover:bg-sky-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all">
                            <SparkleIcon />
                            <span>{isLoading.explain ? 'Loading...' : 'Explain Standard'}</span>
                        </button>
                        <button onClick={handleLessonIdea} disabled={!selectedStandard || isLoading.lesson} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 font-semibold rounded-lg shadow-sm hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all">
                            <SparkleIcon />
                            <span>{isLoading.lesson ? 'Loading...' : 'Lesson Idea'}</span>
                        </button>
                    </div>
                </div>

                {/* --- Step 3: Assignment Generation --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end no-print">
                     <div>
                        <label htmlFor="assignment-type" className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                        <select id="assignment-type" value={assignmentType} onChange={e => setAssignmentType(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>Multiple Choice Quiz</option>
                            <option>Matching Activity</option>
                            <option>Text-Dependent Questions (TDQs)</option>
                            <option>Choose Best CER Response</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                        <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>Remedial</option>
                            <option>On Grade Level</option>
                            <option>Advanced</option>
                        </select>
                    </div>
                    <button onClick={handleGenerateAssignment} disabled={!selectedStandard || isLoading.assignment} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all">
                        <SparkleIcon/>
                        <span>{isLoading.assignment ? 'Generating...' : 'Generate AI Assignment'}</span>
                    </button>
                </div>
            </div>

            {isLoading.assignment && (
                 <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-md">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
                    <p className="text-gray-600 mt-4 font-semibold">Generating assignment based on FLDOE standards...</p>
                </div>
            )}
            
            {generatedAssignment && (
                <div id="printable-assignment" className="p-6 bg-white rounded-2xl shadow-md animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">
                            {selectedStudent ? `Assignment for ${selectedStudent.name}` : `Practice Assignment`} - {selectedStandard}
                        </h3>
                         <button onClick={handlePrint} className="no-print inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all">
                            <Icon path="M6.72 7.66l-1.63-1.63a.75.75 0 0 1 1.06-1.06l1.63 1.63a.75.75 0 0 1-1.06 1.06zM11.25 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008zM12 1.5A5.25 5.25 0 0 0 6.75 6.75v3.375a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3V6.75A5.25 5.25 0 0 0 12 1.5zm-3.75 5.25a3.75 3.75 0 0 1 7.5 0v3.375a3 3 0 0 0-1.5-1.002V8.25a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v3.373a3 3 0 0 0-1.5 1.002V6.75z" className="w-5 h-5"/>
                            <span>Print Activity</span>
                        </button>
                    </div>
                    
                    <div className="print-only mb-4 hidden">
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <p><span className="font-bold">Name:</span> _________________________</p>
                            <p><span className="font-bold">Date:</span> __________________________</p>
                            <p className="col-span-2"><span className="font-bold">Standard:</span> {selectedStandard} - {allStandards.find(s=>s.id === selectedStandard)?.name}</p>
                            <p className="col-span-2"><span className="font-bold">Activity:</span> {generatedAssignment.type}</p>
                        </div>
                        <hr className="my-4"/>
                    </div>

                    {renderGeneratedAssignment()}

                    <div className={`mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-4 no-print ${!selectedStudentId ? 'opacity-50' : ''}`}>
                        <label htmlFor="score" className="font-semibold text-gray-800">Enter Score:</label>
                        <input 
                            type="number" 
                            id="score"
                            min="0"
                            max="100"
                            value={assignmentScore}
                            onChange={e => setAssignmentScore(e.target.value)}
                            className="w-full sm:w-28 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                            placeholder="e.g., 85"
                            disabled={!selectedStudentId}
                        />
                        <button onClick={handleSaveScore} disabled={!selectedStudentId} className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:bg-green-300 disabled:cursor-not-allowed">
                            Save Score
                        </button>
                        {!selectedStudentId && <p className="text-xs text-gray-500 sm:ml-2">Select a student to enable scoring.</p>}
                    </div>
                </div>
            )}
            
            {modalContent && (
                <Modal title={modalContent.title} onClose={() => setModalContent(null)}>
                    <div className="text-gray-600 space-y-4">
                       <p className="font-semibold text-gray-800">{modalContent.explanation}</p>
                        {modalContent.clarifications && modalContent.clarifications.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-bold text-gray-700 mb-2">Official Clarifications:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {modalContent.clarifications.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="p-4 bg-indigo-50 rounded-lg">
                           <p className="font-semibold text-indigo-800 mb-1">{modalContent.example ? 'Real-World Example' : 'Activity'}</p>
                           <p className="text-indigo-700">{modalContent.example || modalContent.activity}</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}


function ProgressTracker({ students }) {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Mastered': return { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-600/20' };
            case 'Approaching': return { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-600/20' };
            case 'Needs Remediation': return { bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-600/20' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-800', ring: 'ring-gray-600/20' };
        }
    };

    return (
        <div className="animate-fade-in">
             <div className="p-6 bg-white rounded-2xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-800">Progress Tracker</h2>
                <p className="text-gray-600 mt-1">Review individual student progress towards standard mastery.</p>
                <div className="mt-6">
                    <label htmlFor="student-select-tracker" className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                    <select id="student-select-tracker" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="">-- Select a Student --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            
            {selectedStudent ? (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{`Mastery Report for ${selectedStudent.name}`}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedStudent.scores.sort((a,b) => a.standard.localeCompare(b.standard)).map(s => {
                            const colors = getStatusColor(s.status);
                            return (
                                <div key={s.standard} className={`p-5 rounded-xl shadow-sm ${colors.bg}`}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-gray-800">{s.standard}</h4>
                                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ring-1 ring-inset ${colors.ring}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{s.score}<span className="text-lg font-medium text-gray-500">/100</span></p>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-400 border-opacity-20">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Intervention History</h5>
                                        <ul className="space-y-2">
                                            {s.history.map((item, index) => (
                                                <li key={index} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{item.type}</span>
                                                    <span className="font-semibold text-gray-800">{item.score}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="mt-6 text-center py-10 px-6 bg-white rounded-2xl shadow-md">
                     <Icon path="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" className="mx-auto h-12 w-12 text-gray-400"/>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Select a student</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose a student to view their progress report.</p>
                </div>
            )}
        </div>
    );
}

// --- APP CONTAINER ---

export default function App() {
    const [view, setView] = useState('roster'); // roster, generator, tracker
    const [students, setStudents] = useState([]);
    const [isXlsxReady, setIsXlsxReady] = useState(false);

    useEffect(() => {
        // Check if the script is already loaded
        if (window.XLSX) {
            setIsXlsxReady(true);
            return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
        script.async = true;

        // Set up onload and onerror handlers
        script.onload = () => setIsXlsxReady(true);
        script.onerror = () => console.error("Failed to load the XLSX library.");

        // Append to body
       document.body.appendChild(script);

        // Cleanup on component unmount
        return () => {
           if(script.parentNode) {
               document.body.removeChild(script);
            }
        };
    }, []); // Empty dependency array ensures this runs only once
    
    const navItems = [
        { id: 'roster', name: 'Student Roster', icon: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-3.741 2.946a9.094 9.094 0 0 1-3.741-.479 3 3 0 0 1-4.682-2.72m-4.682 2.72a3 3 0 0 1-4.682-2.72m6.04-2.28a3 3 0 0 0-3.741-1.332 3 3 0 0 0-3.741 1.332M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 4.951-1.488A3.987 3.987 0 0 0 13 16h-2a3.987 3.987 0 0 0-3.951 3.512A8.949 8.949 0 0 0 12 21Zm0-13.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" },
        { id: 'generator', name: 'Assignment Generator', icon: "M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.47 2.118 2.25 2.25 0 0 0-1.996 1.638 3 3 0 0 0 .703 3.042 3 3 0 0 0 3.042.703 2.25 2.25 0 0 0 1.638-1.996 2.25 2.25 0 0 1 2.118-2.47 3 3 0 0 0 1.128-5.78Zm-1.897-1.128a.75.75 0 0 0-1.06-1.06l-4.95 4.95a.75.75 0 0 0 1.06 1.06l4.95-4.95Zm10.707 1.06a.75.75 0 0 0-1.06-1.06l-4.95 4.95a.75.75 0 0 0 1.06 1.06l4.95-4.95ZM9.53 2.553a.75.75 0 0 0-1.06-1.06l-4.95 4.95a.75.75 0 0 0 1.06 1.06l4.95-4.95Zm7.424 1.06a.75.75 0 0 0-1.06-1.06l-4.95 4.95a.75.75 0 1 0 1.06 1.06l4.95-4.95Z" },
        { id: 'tracker', name: 'Progress Tracker', icon: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h.375m16.5 3.375a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-4.5Z" },
    ];
    
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                .animate-fade-in-up { animation: fadeInUp 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                
                @media print {
                  body * { visibility: hidden; }
                  #printable-assignment, #printable-assignment * { visibility: visible; }
                  #printable-assignment { position: absolute; left: 0; top: 0; width: 100%; }
                  .no-print { display: none; }
                  .print-only { display: block; }
                }
            `}</style>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8 no-print">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Civics Teacher Dashboard</h1>
                    <p className="mt-2 text-lg text-gray-600">Your AI-powered assistant for targeted student intervention.</p>
                </header>

                <nav className="mb-8 bg-white/70 backdrop-blur-md rounded-xl shadow-sm p-2 sticky top-4 z-10 no-print">
                    <ul className="flex items-center justify-center space-x-2 sm:space-x-4">
                        {navItems.map(item => (
                            <li key={item.id} className="flex-1">
                                <button 
                                    onClick={() => setView(item.id)}
                                    className={`w-full flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                                        view === item.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon path={item.icon} className="w-5 h-5"/>
                                    <span className="text-center">{item.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <main>
                    {view === 'roster' && <StudentRoster setStudents={setStudents} isXlsxReady={isXlsxReady} />}
                    {view === 'generator' && <AssignmentGenerator students={students} setStudents={setStudents} />}
                    {view === 'tracker' && <ProgressTracker students={students} />}
                </main>
            </div>
        </div>
    );
}
