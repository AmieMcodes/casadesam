// Activation requires stream settings verification and a separate authorized release.
// Never enable via URL parameters, local storage, preview hosts, or a runtime override.
export const analyticsConfig = {
  enabled: false,
  measurementId: '',
  pages: {
    "/index.html": {
      "path": "/",
      "title": "Casa de SAM"
    },
    "/mission.html": {
      "path": "/mission.html",
      "title": "Casa de SAM — Our Mission"
    },
    "/why-paraguay.html": {
      "path": "/why-paraguay.html",
      "title": "Casa de SAM — Why Paraguay"
    },
    "/sustainability.html": {
      "path": "/sustainability.html",
      "title": "Casa de SAM — How It Sustains Itself"
    },
    "/philosophy.html": {
      "path": "/philosophy.html",
      "title": "Casa de SAM — Our Philosophy"
    },
    "/timeline.html": {
      "path": "/timeline.html",
      "title": "Casa de SAM — The Long View"
    },
    "/blog.html": {
      "path": "/blog.html",
      "title": "Casa de SAM Blog | Lifelong Disability Planning and Adult Housing"
    },
    "/current.html": {
      "path": "/current.html",
      "title": "Current Update | Casa de SAM"
    },
    "/blog/autism-intellectual-disability-and-transition-to-adulthood.html": {
      "path": "/blog/autism-intellectual-disability-and-transition-to-adulthood.html",
      "title": "Autism, Intellectual Disability, and the Transition to Adulthood | Casa de SAM Blog"
    },
    "/blog/balancing-safety-privacy-and-independence-in-residential-care.html": {
      "path": "/blog/balancing-safety-privacy-and-independence-in-residential-care.html",
      "title": "How Residential Programs Can Balance Safety, Privacy, and Independence | Casa de SAM Blog"
    },
    "/blog/building-a-circle-of-support-that-can-outlive-a-parent.html": {
      "path": "/blog/building-a-circle-of-support-that-can-outlive-a-parent.html",
      "title": "Building a Circle of Support That Can Outlive a Parent | Casa de SAM Blog"
    },
    "/blog/can-an-autistic-adult-live-independently.html": {
      "path": "/blog/can-an-autistic-adult-live-independently.html",
      "title": "Can an Autistic Adult Live Independently? | Casa de SAM Blog"
    },
    "/blog/contribution-beyond-a-traditional-job.html": {
      "path": "/blog/contribution-beyond-a-traditional-job.html",
      "title": "What Contribution Can Look Like Beyond a Traditional Job | Casa de SAM Blog"
    },
    "/blog/designing-disability-housing-around-real-people.html": {
      "path": "/blog/designing-disability-housing-around-real-people.html",
      "title": "Designing Disability Housing Around Real People, Not Minimum Requirements | Casa de SAM Blog"
    },
    "/blog/group-homes-versus-residential-communities.html": {
      "path": "/blog/group-homes-versus-residential-communities.html",
      "title": "Group Homes vs. Residential Communities | Casa de SAM"
    },
    "/blog/guardianship-supported-decision-making-and-adult-disability.html": {
      "path": "/blog/guardianship-supported-decision-making-and-adult-disability.html",
      "title": "Guardianship, Supported Decision-Making, and Adult Disability | Casa de SAM Blog"
    },
    "/blog/housing-for-nonverbal-autistic-adults-with-high-support-needs.html": {
      "path": "/blog/housing-for-nonverbal-autistic-adults-with-high-support-needs.html",
      "title": "Housing for Nonverbal Autistic Adults With High Support Needs | Casa de SAM Blog"
    },
    "/blog/housing-options-for-adults-with-autism-and-intellectual-disabilities.html": {
      "path": "/blog/housing-options-for-adults-with-autism-and-intellectual-disabilities.html",
      "title": "Housing Options for Adults With Autism and Intellectual Disabilities | Casa de SAM Blog"
    },
    "/blog/how-daily-routines-create-safety-without-becoming-restrictive.html": {
      "path": "/blog/how-daily-routines-create-safety-without-becoming-restrictive.html",
      "title": "How Daily Routines Can Create Safety Without Becoming Restrictive | Casa de SAM Blog"
    },
    "/blog/how-much-does-lifelong-care-for-an-autistic-adult-cost.html": {
      "path": "/blog/how-much-does-lifelong-care-for-an-autistic-adult-cost.html",
      "title": "How Much Does Lifelong Care for an Autistic Adult Cost? | Casa de SAM Blog"
    },
    "/blog/how-sensory-friendly-housing-supports-autistic-residents.html": {
      "path": "/blog/how-sensory-friendly-housing-supports-autistic-residents.html",
      "title": "How Sensory-Friendly Housing Supports Autistic Residents | Casa de SAM Blog"
    },
    "/blog/how-to-begin-future-planning-without-every-answer.html": {
      "path": "/blog/how-to-begin-future-planning-without-every-answer.html",
      "title": "How to Begin Future Planning Without Having Every Answer | Casa de SAM Blog"
    },
    "/blog/independent-living-supported-living-and-residential-care.html": {
      "path": "/blog/independent-living-supported-living-and-residential-care.html",
      "title": "Independent Living vs Supported Living vs Residential Care | Casa de SAM"
    },
    "/blog/life-skills-for-autistic-adults-with-significant-support-needs.html": {
      "path": "/blog/life-skills-for-autistic-adults-with-significant-support-needs.html",
      "title": "Life Skills for Autistic Adults With Significant Support Needs | Casa de SAM Blog"
    },
    "/blog/meaningful-adult-life-with-significant-disabilities.html": {
      "path": "/blog/meaningful-adult-life-with-significant-disabilities.html",
      "title": "What Does a Meaningful Adult Life Look Like for Someone With Significant Disabilities? | Casa de SAM Blog"
    },
    "/blog/meaningful-daily-activities-for-adults-with-intellectual-disabilities.html": {
      "path": "/blog/meaningful-daily-activities-for-adults-with-intellectual-disabilities.html",
      "title": "Meaningful Daily Activities for Adults With Intellectual Disabilities | Casa de SAM Blog"
    },
    "/blog/meaningful-work-for-adults-with-intellectual-disabilities.html": {
      "path": "/blog/meaningful-work-for-adults-with-intellectual-disabilities.html",
      "title": "Meaningful Work for Adults With Intellectual Disabilities | Casa de SAM Blog"
    },
    "/blog/medication-support-in-housing-for-adults-with-disabilities.html": {
      "path": "/blog/medication-support-in-housing-for-adults-with-disabilities.html",
      "title": "Medication Support in Housing for Adults With Disabilities | Casa de SAM Blog"
    },
    "/blog/parents-guide-to-planning-for-lifelong-disability-care.html": {
      "path": "/blog/parents-guide-to-planning-for-lifelong-disability-care.html",
      "title": "A Parent’s Guide to Planning for Lifelong Disability Care | Casa de SAM Blog"
    },
    "/blog/planning-for-care-without-knowing-future-costs.html": {
      "path": "/blog/planning-for-care-without-knowing-future-costs.html",
      "title": "Planning for Care Without Knowing Exactly What the Future Will Cost | Casa de SAM Blog"
    },
    "/blog/preparing-for-adult-life-before-special-education-ends.html": {
      "path": "/blog/preparing-for-adult-life-before-special-education-ends.html",
      "title": "Preparing for Adult Life Before Special Education Ends | Casa de SAM Blog"
    },
    "/blog/protecting-a-vulnerable-adult-without-erasing-their-voice.html": {
      "path": "/blog/protecting-a-vulnerable-adult-without-erasing-their-voice.html",
      "title": "How Families Can Protect a Vulnerable Adult Without Erasing Their Voice | Casa de SAM Blog"
    },
    "/blog/quality-of-life-for-adults-with-high-support-needs.html": {
      "path": "/blog/quality-of-life-for-adults-with-high-support-needs.html",
      "title": "Rethinking Quality of Life for Adults With High Support Needs | Casa de SAM Blog"
    },
    "/blog/questions-to-ask-about-your-disabled-childs-future.html": {
      "path": "/blog/questions-to-ask-about-your-disabled-childs-future.html",
      "title": "The Questions Every Parent Should Ask About Their Disabled Child’s Future | Casa de SAM Blog"
    },
    "/blog/supporting-choice-without-complete-independence.html": {
      "path": "/blog/supporting-choice-without-complete-independence.html",
      "title": "Supporting Choice When an Adult Cannot Live Completely Independently | Casa de SAM Blog"
    },
    "/blog/what-does-24-hour-support-look-like.html": {
      "path": "/blog/what-does-24-hour-support-look-like.html",
      "title": "What Does 24-Hour Support Look Like in a Residential Community? | Casa de SAM Blog"
    },
    "/blog/what-does-lifelong-support-actually-mean.html": {
      "path": "/blog/what-does-lifelong-support-actually-mean.html",
      "title": "What Does Lifelong Support Actually Mean? | Casa de SAM Blog"
    },
    "/blog/what-happens-to-disabled-adults-without-family-caregivers.html": {
      "path": "/blog/what-happens-to-disabled-adults-without-family-caregivers.html",
      "title": "What Happens to Disabled Adults Who Have No Family Caregiver? | Casa de SAM Blog"
    },
    "/blog/what-happens-when-autistic-child-turns-18.html": {
      "path": "/blog/what-happens-when-autistic-child-turns-18.html",
      "title": "What Happens When a Child With Autism Turns 18? | Casa de SAM Blog"
    },
    "/blog/what-is-a-day-program-for-adults-with-autism.html": {
      "path": "/blog/what-is-a-day-program-for-adults-with-autism.html",
      "title": "What Is a Day Program for Adults With Autism? | Casa de SAM Blog"
    },
    "/blog/what-is-a-group-home-for-adults-with-autism.html": {
      "path": "/blog/what-is-a-group-home-for-adults-with-autism.html",
      "title": "What Is a Group Home for Adults With Autism? | Casa de SAM Blog"
    },
    "/blog/what-is-supported-living-for-autistic-adults.html": {
      "path": "/blog/what-is-supported-living-for-autistic-adults.html",
      "title": "What Is Supported Living for Autistic Adults? | Casa de SAM Blog"
    },
    "/blog/what-makes-a-home-safe-for-an-autistic-adult.html": {
      "path": "/blog/what-makes-a-home-safe-for-an-autistic-adult.html",
      "title": "What Makes a Home Safe for an Autistic Adult? | Casa de SAM Blog"
    },
    "/blog/where-will-my-autistic-child-live-as-an-adult.html": {
      "path": "/blog/where-will-my-autistic-child-live-as-an-adult.html",
      "title": "Where Will My Autistic Child Live as an Adult? | Casa de SAM Blog"
    },
    "/blog/who-makes-decisions-for-an-autistic-adult.html": {
      "path": "/blog/who-makes-decisions-for-an-autistic-adult.html",
      "title": "Who Makes Decisions for an Autistic Adult Who Cannot Live Independently? | Casa de SAM Blog"
    },
    "/blog/who-will-care-for-my-autistic-child-when-i-die.html": {
      "path": "/blog/who-will-care-for-my-autistic-child-when-i-die.html",
      "title": "Who Will Care for My Autistic Child When I Die? | Casa de SAM Blog"
    },
    "/blog/why-adult-autism-services-cannot-focus-only-on-employment.html": {
      "path": "/blog/why-adult-autism-services-cannot-focus-only-on-employment.html",
      "title": "Why Adult Autism Services Cannot Focus Only on Employment | Casa de SAM Blog"
    },
    "/blog/why-adults-with-autism-need-more-than-basic-care.html": {
      "path": "/blog/why-adults-with-autism-need-more-than-basic-care.html",
      "title": "Why Adults With Autism Need More Than Basic Care | Casa de SAM Blog"
    },
    "/blog/why-casa-de-sam-is-building-homes-not-an-institution.html": {
      "path": "/blog/why-casa-de-sam-is-building-homes-not-an-institution.html",
      "title": "Why Casa de SAM Is Building Homes, Not an Institution"
    },
    "/blog/why-disability-housing-needs-a-sustainable-financial-model.html": {
      "path": "/blog/why-disability-housing-needs-a-sustainable-financial-model.html",
      "title": "Why Safe Disability Housing Requires a Sustainable Financial Model | Casa de SAM Blog"
    },
    "/blog/why-disability-support-plans-must-be-individualized.html": {
      "path": "/blog/why-disability-support-plans-must-be-individualized.html",
      "title": "Why Disability Support Plans Must Be Individualized | Casa de SAM Blog"
    },
    "/blog/why-every-adult-deserves-purpose-routine-and-belonging.html": {
      "path": "/blog/why-every-adult-deserves-purpose-routine-and-belonging.html",
      "title": "Why Every Adult Deserves Purpose, Routine, and Belonging | Casa de SAM Blog"
    },
    "/blog/why-families-should-begin-lifelong-disability-planning-early.html": {
      "path": "/blog/why-families-should-begin-lifelong-disability-planning-early.html",
      "title": "Why Families Should Begin Lifelong Disability Planning Early | Casa de SAM Blog"
    },
    "/blog/why-independence-should-not-be-the-only-goal.html": {
      "path": "/blog/why-independence-should-not-be-the-only-goal.html",
      "title": "Why Independence Should Not Be the Only Goal for Autistic Adults | Casa de SAM Blog"
    },
    "/blog/why-siblings-should-not-be-the-entire-care-plan.html": {
      "path": "/blog/why-siblings-should-not-be-the-entire-care-plan.html",
      "title": "Why Siblings Should Not Be the Entire Lifelong Care Plan | Casa de SAM Blog"
    },
    "/blog/why-the-end-of-school-services-feels-like-a-cliff.html": {
      "path": "/blog/why-the-end-of-school-services-feels-like-a-cliff.html",
      "title": "Why the End of School Services Can Feel Like Falling Off a Cliff | Casa de SAM Blog"
    }
  }
};
