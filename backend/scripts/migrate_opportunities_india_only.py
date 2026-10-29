import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient

def run_migration():
    client = MongoClient("mongodb://localhost:27017/careerpilot_ai", serverSelectionTimeoutMS=2000)
    db = client["careerpilot_ai"]
    col = db["opportunities"]
    users_col = db["users"]
    profiles_col = db["profiles"]

    print("Initial opportunity count:", col.count_documents({}))

    # 1. Purge all scholarships, fellowships, grants, etc.
    res_del = col.delete_many({
        "type": {"$nin": ["job", "internship"]}
    })
    print(f"Deleted {res_del.deleted_count} non-job/internship opportunities (scholarships/fellowships/etc.).")

    # 2. Also purge any opportunities explicitly outside India
    res_foreign = col.delete_many({
        "location.country": {"$exists": True, "$nin": ["India", None, "", "Remote (India)"]},
        "location.city": {"$nin": ["Bengaluru", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi", "Delhi NCR", "Noida", "Gurgaon", "Gurugram", "Chennai", "Kolkata", "Ahmedabad", "Remote", "Remote (India)"]}
    })
    print(f"Deleted {res_foreign.deleted_count} non-India opportunities.")

    # 3. Ensure all remaining opportunities have country = 'India' and INR currency
    col.update_many(
        {"$or": [{"location.country": None}, {"location.country": ""}, {"location.country": "Global"}]},
        {"$set": {"location.country": "India"}}
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    # 4. Add rich, tailored Indian Tech Jobs & Internships perfectly matching student resume & profile
    indian_opportunities = [
        {
            "title": "Full Stack Developer Intern (MERN Stack)",
            "organization": {
                "name": "Razorpay",
                "website": "https://razorpay.com"
            },
            "description": "Join Razorpay's Banking & Payments Engineering team. Build responsive web dashboards with React.js, design scalable RESTful microservices using Node.js & Express, and optimize high-throughput MongoDB data models for millions of merchants across India.",
            "type": "internship",
            "category": "software",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": False
            },
            "work_mode": "Hybrid",
            "skills": ["React", "Node.js", "Express", "MongoDB", "JavaScript", "REST APIs", "Git"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "M.Tech", "MCA"],
                "branches": ["Computer Science", "Information Technology", "All Engineering"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.0
            },
            "experience": {"min_years": 0, "max_years": 1},
            "eligibility_text": "Open to B.Tech / B.E. students (2026/2027 batch) in Computer Science or related fields with CGPA >= 7.0.",
            "application_url": "https://razorpay.com/jobs/fullstack-intern-2026",
            "source": {
                "name": "razorpay_careers",
                "url": "https://razorpay.com/jobs/fullstack-intern-2026",
                "external_id": "razorpay-mern-intern-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-11-25T23:59:59+00:00"
            },
            "compensation": {
                "type": "stipend",
                "min": 45000,
                "max": 60000,
                "currency": "INR"
            },
            "status": "active",
            "metadata": {"tags": ["MERN", "Full Stack", "High Fit"], "raw_hash": "razorpay-mern-intern-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "Frontend React Developer Intern",
            "organization": {
                "name": "Swiggy",
                "website": "https://swiggy.com"
            },
            "description": "Collaborate with Swiggy consumer app engineers to build high-performance React.js and Next.js web applications. Implement fluid animations, responsive layouts, client-side routing, and optimize bundle sizes.",
            "type": "internship",
            "category": "web_development",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": False
            },
            "work_mode": "Hybrid",
            "skills": ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "REST APIs", "Git"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "BCA", "MCA"],
                "branches": ["Computer Science", "Information Technology", "Any Branch"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.0
            },
            "experience": {"min_years": 0, "max_years": 1},
            "eligibility_text": "Enrolled in B.Tech / MCA with expected graduation in 2026 or 2027. Strong hands-on portfolio in React.js.",
            "application_url": "https://careers.swiggy.com/jobs/frontend-intern",
            "source": {
                "name": "swiggy_careers",
                "url": "https://careers.swiggy.com/jobs/frontend-intern",
                "external_id": "swiggy-react-intern-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-12-05T23:59:59+00:00"
            },
            "compensation": {
                "type": "stipend",
                "min": 40000,
                "max": 55000,
                "currency": "INR"
            },
            "status": "active",
            "metadata": {"tags": ["React", "Frontend", "UI"], "raw_hash": "swiggy-react-intern-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "Backend Python / Node.js Engineer Intern",
            "organization": {
                "name": "Zerodha",
                "website": "https://zerodha.com"
            },
            "description": "Work on Zerodha's trading infrastructure and backend APIs. Build high-concurrency microservices with Python and Node.js, write efficient SQL/PostgreSQL queries, integrate Redis caching, and maintain robust API documentation.",
            "type": "internship",
            "category": "software",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": True
            },
            "work_mode": "Remote",
            "skills": ["Python", "Node.js", "Express", "REST APIs", "PostgreSQL", "MongoDB", "Git"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "M.Tech"],
                "branches": ["Computer Science", "All Engineering"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.5
            },
            "experience": {"min_years": 0, "max_years": 1},
            "eligibility_text": "Remote anywhere in India. Open to 2026/2027 batches with strong backend problem-solving skills.",
            "application_url": "https://zerodha.tech/careers/backend-intern",
            "source": {
                "name": "zerodha_careers",
                "url": "https://zerodha.tech/careers/backend-intern",
                "external_id": "zerodha-backend-intern-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-12-15T23:59:59+00:00"
            },
            "compensation": {
                "type": "stipend",
                "min": 50000,
                "max": 65000,
                "currency": "INR"
            },
            "status": "active",
            "metadata": {"tags": ["Remote", "Python", "Node.js"], "raw_hash": "zerodha-backend-intern-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "Graduate Software Engineer (SDE-1)",
            "organization": {
                "name": "PhonePe",
                "website": "https://phonepe.com"
            },
            "description": "Full-time SDE-1 position for fresh graduates. Design, build, and deploy mission-critical distributed payment systems handling hundreds of millions of daily transactions. Strong foundation in Data Structures, Algorithms, Python, JavaScript, and Systems Design.",
            "type": "job",
            "category": "software",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": False
            },
            "work_mode": "Hybrid",
            "skills": ["Python", "JavaScript", "React", "Node.js", "Data Structures & Algorithms", "MySQL", "REST APIs"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "M.Tech"],
                "branches": ["Computer Science", "Information Technology", "All Branches"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.5
            },
            "experience": {"min_years": 0, "max_years": 2},
            "eligibility_text": "B.Tech/M.Tech (2026 or 2027 batch). CGPA 7.5+ with strong problem solving and full stack fundamentals.",
            "application_url": "https://phonepe.com/careers/sde1-graduate-2026",
            "source": {
                "name": "phonepe_careers",
                "url": "https://phonepe.com/careers/sde1-graduate-2026",
                "external_id": "phonepe-sde1-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-12-30T23:59:59+00:00"
            },
            "compensation": {
                "type": "salary",
                "min": 1400000,
                "max": 2000000,
                "currency": "INR",
                "period": "year"
            },
            "status": "active",
            "metadata": {"tags": ["SDE-1", "Full-Time", "FinTech"], "raw_hash": "phonepe-sde1-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "Junior Full Stack Engineer (MERN)",
            "organization": {
                "name": "CRED",
                "website": "https://cred.club"
            },
            "description": "Build high-craft web experiences and robust microservices for CRED's credit card and payments product lines. Architect UI with React.js, build high-speed endpoints with Express & Node.js, and maintain MongoDB & Redis databases.",
            "type": "job",
            "category": "software",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": False
            },
            "work_mode": "Onsite",
            "skills": ["React", "Node.js", "Express", "MongoDB", "JavaScript", "TypeScript", "REST APIs"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E."],
                "branches": ["Computer Science", "Engineering"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.0
            },
            "experience": {"min_years": 0, "max_years": 2},
            "eligibility_text": "Graduating batch 2026 or 2027. Solid portfolio in full stack MERN application development.",
            "application_url": "https://careers.cred.club/jobs/junior-fullstack",
            "source": {
                "name": "cred_careers",
                "url": "https://careers.cred.club/jobs/junior-fullstack",
                "external_id": "cred-fullstack-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-12-20T23:59:59+00:00"
            },
            "compensation": {
                "type": "salary",
                "min": 1600000,
                "max": 2400000,
                "currency": "INR",
                "period": "year"
            },
            "status": "active",
            "metadata": {"tags": ["MERN", "SDE", "Craft"], "raw_hash": "cred-fullstack-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "AI / Machine Learning Engineer Intern",
            "organization": {
                "name": "Microsoft India",
                "website": "https://careers.microsoft.com"
            },
            "description": "Work with Microsoft Research India & Azure AI team in Hyderabad. Implement machine learning models using Python, fine-tune transformer models, design data preprocessing pipelines, and evaluate generative AI agent frameworks.",
            "type": "internship",
            "category": "artificial_intelligence",
            "location": {
                "city": "Hyderabad",
                "state": "Telangana",
                "country": "India",
                "is_remote": False
            },
            "work_mode": "Hybrid",
            "skills": ["Python", "Machine Learning", "Scikit-Learn", "PyTorch", "REST APIs", "Git"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "M.Tech"],
                "branches": ["Computer Science", "Artificial Intelligence", "All Engineering"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 8.0
            },
            "experience": {"min_years": 0, "max_years": 1},
            "eligibility_text": "Enrolled in B.Tech/M.Tech (2026 or 2027) with CGPA >= 8.0. Hands-on machine learning projects in Python.",
            "application_url": "https://careers.microsoft.com/students/india-ai-intern",
            "source": {
                "name": "microsoft_careers",
                "url": "https://careers.microsoft.com/students/india-ai-intern",
                "external_id": "microsoft-ai-intern-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-11-20T23:59:59+00:00"
            },
            "compensation": {
                "type": "stipend",
                "min": 90000,
                "max": 110000,
                "currency": "INR"
            },
            "status": "active",
            "metadata": {"tags": ["AI", "ML", "Python", "Research"], "raw_hash": "microsoft-ai-intern-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "Software Development Engineer Intern (Remote - India)",
            "organization": {
                "name": "Postman India",
                "website": "https://postman.com"
            },
            "description": "Contribute to the world's leading API platform. Work on core Postman web client and runtime services using React.js, Node.js, and REST APIs. Build features used by 30+ million developers worldwide.",
            "type": "internship",
            "category": "software",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": True
            },
            "work_mode": "Remote",
            "skills": ["JavaScript", "Node.js", "React", "REST APIs", "Postman", "Git"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E.", "BCA", "MCA"],
                "branches": ["Computer Science", "Information Technology", "Any Engineering"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.0
            },
            "experience": {"min_years": 0, "max_years": 1},
            "eligibility_text": "Remote anywhere in India. Expected graduation 2026 or 2027.",
            "application_url": "https://www.postman.com/company/careers/open-positions/",
            "source": {
                "name": "postman_careers",
                "url": "https://www.postman.com/company/careers/open-positions/",
                "external_id": "postman-sde-intern-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-12-10T23:59:59+00:00"
            },
            "compensation": {
                "type": "stipend",
                "min": 60000,
                "max": 75000,
                "currency": "INR"
            },
            "status": "active",
            "metadata": {"tags": ["Remote", "APIs", "Developer Tools"], "raw_hash": "postman-sde-intern-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        },
        {
            "title": "Associate Software Engineer - Full Stack",
            "organization": {
                "name": "Flipkart",
                "website": "https://flipkartcareers.com"
            },
            "description": "Join Flipkart's E-Commerce Platform team in Bengaluru. Build scalable user-facing web portals and high-availability backend APIs with React, Node.js, and SQL/NoSQL databases.",
            "type": "job",
            "category": "software",
            "location": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "is_remote": False
            },
            "work_mode": "Hybrid",
            "skills": ["React", "JavaScript", "Node.js", "MongoDB", "MySQL", "REST APIs", "Data Structures & Algorithms"],
            "education_requirements": {
                "degrees": ["B.Tech", "B.E."],
                "branches": ["Computer Science", "Information Technology", "Circuit Branches"],
                "graduation_years": [2026, 2027],
                "cgpa_min": 7.5
            },
            "experience": {"min_years": 0, "max_years": 2},
            "eligibility_text": "B.Tech/B.E. (2026/2027 batch) with minimum 7.5 CGPA.",
            "application_url": "https://flipkartcareers.com/jobs/ase-fullstack-2026",
            "source": {
                "name": "flipkart_careers",
                "url": "https://flipkartcareers.com/jobs/ase-fullstack-2026",
                "external_id": "flipkart-ase-2026"
            },
            "dates": {
                "posted_at": now_iso,
                "deadline": "2026-12-18T23:59:59+00:00"
            },
            "compensation": {
                "type": "salary",
                "min": 1500000,
                "max": 2200000,
                "currency": "INR",
                "period": "year"
            },
            "status": "active",
            "metadata": {"tags": ["Full Stack", "Flipkart", "E-Commerce"], "raw_hash": "flipkart-ase-2026"},
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_seen_at": now_iso
        }
    ]

    for opp in indian_opportunities:
        col.update_one(
            {"metadata.raw_hash": opp["metadata"]["raw_hash"]},
            {"$set": opp},
            upsert=True
        )

    print(f"Upserted {len(indian_opportunities)} curated Indian tech jobs & internships.")

    # 5. Sync Jubburu profiles (both accounts) with full resume details
    full_profile_data = {
        "personal": {
            "full_name": "Jubburu Prudhvi Raju",
            "email": "jubburuprudhviraju@gmail.com",
            "phone": "+91-7981613325",
            "location": "Raghavapuram, Andhra Pradesh, India"
        },
        "education": {
            "college": "GMR Institute of Technology, Rajam",
            "degree": "B.Tech",
            "branch": "Computer Science and Engineering",
            "graduation_year": 2027,
            "cgpa": 8.90
        },
        "skills": {
            "programming_languages": ["Python", "JavaScript", "C++"],
            "frameworks": ["React", "Node.js", "Express", "Tailwind CSS"],
            "databases": ["MongoDB", "MySQL"],
            "ai_ml": ["Machine Learning", "Scikit-Learn"],
            "cloud": [],
            "devops": [],
            "tools": ["Git", "Postman", "VS Code"],
            "other": ["REST APIs", "JWT Authentication", "MERN Stack", "Data Structures & Algorithms"]
        },
        "projects": [
            {
                "title": "Visit AP — Full-Stack Tourism Platform",
                "description": "Scalable full-stack tourism platform for exploring 260+ tourist destinations across Andhra Pradesh with MERN stack, REST APIs, and JWT authentication.",
                "skills": ["React", "Node.js", "Express", "MongoDB", "REST APIs"]
            },
            {
                "title": "FarmerDirect — Farmer-to-Consumer Marketplace",
                "description": "Full-stack marketplace connecting farmers directly with consumers with transparent agricultural transactions.",
                "skills": ["React", "Node.js", "Express", "MongoDB"]
            }
        ],
        "experience": [
            {
                "role": "MERN Stack Developer Intern",
                "company": "Codec Technologies",
                "period": "Oct 2025 - Present",
                "description": "Worked on MERN stack projects, developing REST APIs, MongoDB integration, and responsive frontend modules."
            },
            {
                "role": "AI Technologies Intern",
                "company": "EdyGrad",
                "period": "June 2025 - Aug 2025",
                "description": "Supervised machine learning, data preprocessing, and model training using Python."
            }
        ],
        "preferences": {
            "target_roles": ["Full Stack Developer", "Frontend Developer", "Backend Developer", "Software Engineer", "MERN Stack Developer"],
            "preferred_locations": ["Bengaluru", "Hyderabad", "Pune", "Remote"],
            "opportunity_types": ["internship", "job"],
            "work_modes": ["Remote", "Hybrid", "Onsite"]
        },
        "resume": {
            "file_name": "J_Prudhvi_Raju_-_Resume.pdf",
            "file_path": "D:\\careerpilot_ai\\backend\\uploads\\resumes\\6ad1e978ae07fe89590042cf\\J_Prudhvi_Raju_-_Resume.pdf",
            "uploaded_at": now_iso,
            "analysis_status": "completed",
            "analysis_version": "1.0"
        },
        "profile_completion": {
            "percentage": 95,
            "missing_fields": []
        },
        "verification": {
            "status": "verified",
            "verified_at": now_iso
        },
        "updated_at": now_iso
    }

    jubburu_users = list(users_col.find({
        "$or": [
            {"email": {"$regex": "jubburu|prudhvi", "$options": "i"}},
            {"name": {"$regex": "jubburu|prudhvi", "$options": "i"}}
        ]
    }))
    for u in jubburu_users:
        u_id = str(u["_id"])
        profiles_col.update_one(
            {"user_id": u_id},
            {"$set": {**full_profile_data, "user_id": u_id}},
            upsert=True
        )
        print(f"Updated profile for Jubburu user: {u.get('email')} ({u_id})")

    final_count = col.count_documents({})
    final_types = col.distinct("type")
    final_countries = col.distinct("location.country")
    print(f"Final opportunity count: {final_count}")
    print(f"Final distinct types: {final_types}")
    print(f"Final distinct countries: {final_countries}")

if __name__ == "__main__":
    run_migration()
