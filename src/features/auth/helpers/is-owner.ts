export function isOwner(resourceDataObject: any, user: User) {
  if (!resourceDataObject || !user) {
    return false;
  }
  if (resourceDataObject.owner_id) {
    return resourceDataObject.owner_id === user.id;
  } else if (resourceDataObject.user_id) {
    return resourceDataObject.user_id === user.id;
  }
  return false;
}
