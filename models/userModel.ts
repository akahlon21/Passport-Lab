import { User } from "../interfaces";

const database: User[] = [
  { id: 1, name: "Jimmy Smith", email: "jimmy123@gmail.com", password: "jimmy123!", role: "admin" },
  { id: 2, name: "Johnny Doe", email: "johnny123@gmail.com", password: "johnny123!", role: "user" },
  { id: 3, name: "Jonathan Chen", email: "jonathan123@gmail.com", password: "jonathan123!", role: "user" },
];

const userModel = {
  findOne: (email: string): User | undefined => database.find(user => user.email === email),
  findById: (id: number): User | undefined => database.find(user => user.id === id),
  findOrCreateGithub: (githubId: string, name: string): User => {
    const existingUser = database.find(user => user.githubId === githubId);
    if (existingUser) {
      existingUser.name = name;
      return existingUser;
    }
    const user: User = {
      id: Math.max(0, ...database.map(user => user.id)) + 1,
      githubId,
      name,
      role: "user",
    };
    database.push(user);
    return user;
  },
};

export { database, userModel };
