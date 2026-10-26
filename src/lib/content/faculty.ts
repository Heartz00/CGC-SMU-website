export const facultyPositions = [
  { key: "advisor", role: "Faculty Advisor" },
  { key: "chair", role: "Department Chair" },
] as const;
export const facultySlug = "cgc-faculty";

export const defaultFaculty = [
  {
    name: "Dr. Peng Tao",
    role: "Faculty Advisor",
    term: "",
    email: "ptao@smu.edu",
    bio: "Professor of Chemistry at SMU whose research combines computational chemistry, protein dynamics, and machine learning to study chemical and biological systems.",
    photo:
      "https://www.smu.edu/-/media/site/dedman/departments-official/chemistry/directory/2026/37485d-018_tao.jpg?h=1200&iar=0&mw=800&w=800&hash=EA0D02589E665139E2AA8760DCBA709D",
    photoPosition: "top" as const,
  },
  {
    name: "Dr. David Y. Son",
    role: "Department Chair",
    term: "",
    email: "dson@smu.edu",
    bio: "Professor and Chair of Chemistry at SMU. His research focuses on polymer synthesis and characterization, click chemistry, and organosilicon chemistry.",
    photo:
      "https://www.smu.edu/-/media/site/dedman/departments-official/chemistry/directory/2025/son-1080x1080.jpg?h=800&hash=62D91DCEBB032D86A95B79587CE832C3&iar=0&mw=800&w=800",
    photoPosition: "top" as const,
  },
];

export function facultyImage(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "blog.smu.edu" ||
        (url.hostname === "www.smu.edu" &&
          url.pathname.startsWith(
            "/-/media/site/dedman/departments-official/chemistry/directory/",
          )))
    );
  } catch {
    return false;
  }
}
