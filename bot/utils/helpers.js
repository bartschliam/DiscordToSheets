function splitAndSend(channel, content) {
  const maxLength = 2000;
  const lines = content.split('\n');
  let chunk = '';

  for (const line of lines) {
    if ((chunk + line + '\n').length > maxLength) {
      channel.send(chunk);
      chunk = '';
    }
    chunk += line + '\n';
  }

  if (chunk.length > 0) {
    channel.send(chunk);
  }
}

async function fetchAllMembers(guild) {
  const allMembers = new Map();
  let lastMemberId;
  const limit = 1000;

  while (true) {
    const members = await guild.members.list({ limit, after: lastMemberId });
    if (members.size === 0) break;

    members.forEach((member) => allMembers.set(member.id, member));
    lastMemberId = [...members.keys()].pop();
  }

  return Array.from(allMembers.values());
}

module.exports = { splitAndSend, fetchAllMembers };
