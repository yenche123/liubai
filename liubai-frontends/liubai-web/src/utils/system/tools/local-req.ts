import { db } from "../../db";


async function deleteUser(id: string) {
  await db.users.delete(id)
  return true
}

async function deleteWorkspace(id: string) {
  const del = await db.workspaces.delete(id)
  return true
}

async function deleteMember(id: string) {
  const del = await db.members.delete(id)
  return true
}

export default {
  deleteUser,
  deleteWorkspace,
  deleteMember,
}