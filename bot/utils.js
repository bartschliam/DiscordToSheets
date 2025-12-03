
// // Role Leaderboard
// client.on("messageCreate", async (message) => {
//   // Ensure we're in the correct server
//   const guild = client.guilds.cache.get("412572204954288128");
//   if (!guild) {
//     console.log("Server Clash of Clans Events not found. Skipping.");
//     return;
//   }

//   const isLiam = message.author.username === 'liamtitan';

//   if (message.content.startsWith("!roleleaderboard") & isLiam) {
//     console.log('Authorized')
//     const members = await fetchAllMembers(message.guild);
//     const number = 50;

//     const roleCounts = members
//       .map((member) => {
//         // Filter out the @everyone role
//         const roles = member.roles.cache
//           .filter((r) => r.name !== "@everyone")
//           .map((r) => r.name);

//         return {
//           name: member.user.tag,
//           count: roles.length,
//           roles: roles,
//         };
//       })
//       .sort((a, b) => b.count - a.count)
//       .slice(0, number);

//     if (roleCounts.length === 0) {
//       return message.reply("No users found with roles.");
//     }

//     const leaderboard = roleCounts
//       .map((m, i) => {
//         const roleList = m.roles.join("\n, "); // Limit to first 5 roles to avoid message overflow
//         return `**${i + 1}.** ${m.name}: ${m.count} roles (${roleList}})`;
//       })
//       .join("\n");

//     // message.channel.send(`**Top ${number} Members with Most Roles:**\n${leaderboard}`);
//     splitAndSend(message.channel, leaderboard);

//   }
// });

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
  let allMembers = new Map(); // Store members uniquely
  let lastMemberId = undefined; // Used for pagination
  let limit = 1000; // Max per request

  while (true) {
    const members = await guild.members.list({
      limit,
      after: lastMemberId, // Fetch members **after** this ID
    });

    if (members.size === 0) break; // Stop when no more members

    members.forEach((member) => allMembers.set(member.id, member));
    lastMemberId = [...members.keys()].pop(); // Get last fetched member ID
  }

  return Array.from(allMembers.values()); // Convert map back to array
}

// // Mass Assign Roles
// client.on('messageCreate', async (message) => {
//   // Ensure we're in the correct server
//   const guild = client.guilds.cache.get("412572204954288128");
//   if (!guild) {
//     console.log("Server Clash of Clans Events not found. Skipping.");
//     return;
//   }

//   if (!message.content.startsWith('!massassign') || message.author.bot) return;

//   const isLiam = message.author.username === 'liamtitan';

//   if (!isLiam) {
//     console.log(`Unauthorized !massassign attempt by ${message.author.tag}`);
//     return;
//   }

//   const lines = message.content.split('\n').slice(1); // skip the command itself
//   if (lines.length < 2) {
//     console.log('Invalid !massassign input: not enough lines');
//     return message.reply('Include usernames and a role name or ID at the end.');
//   }

//   const roleIdentifier = lines.pop().trim(); // Last line = role name or ID
//   const usernames = lines.map(line => line.trim()).filter(Boolean);

//   const role = message.guild.roles.cache.find(
//     r => r.name === roleIdentifier || r.id === roleIdentifier
//   );

//   if (!role) {
//     return message.reply(`Role "${roleIdentifier}" not found.`);
//   }

//   let added = 0;
//   let notFound = [];

//   for (const username of usernames) {
//     const members = await message.guild.members.fetch();
//     const member = members.find(
//       m => m.user.username === username
//     );

//     if (member) {
//       try {
//         await member.roles.add(role);
//         added++;
//         console.log(`✅ Added ${role.name} to ${username}`);
//       } catch (err) {
//         console.error(`❌ Failed to assign role to ${username}:`, err);
//         notFound.push(`${username} (error)`);
//       }
//     } else {
//       console.log(`❌ Username not found: ${username}`);
//       notFound.push(username);
//     }
//   }

//   message.reply(
//     `✅ Assigned "${role.name}" to ${added} user(s).\n❌ ${notFound.length} not found:\n${notFound.join(', ')}`
//   );
// });

