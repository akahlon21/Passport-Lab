import { userModel } from "../models/userModel";

export const getUserByEmail = (email: string) => userModel.findOne(email);
export const getUserById = (id: number) => userModel.findById(id);
