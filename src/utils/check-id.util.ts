/**
 * Extracts the static ID of a message type.
 *
 * Postboy <= 3.4 exported this helper as `checkId`; since 3.5 it is internal,
 * so the same semantics are reimplemented here.
 */
export function checkId(message: new (...args: any[]) => any): string {
  if (!(message as any).ID) throw new Error(`${message.name} should have a static ID field`);
  return (message as any).ID;
}
