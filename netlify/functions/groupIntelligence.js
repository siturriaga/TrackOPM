const { requireUser, json, badRequest } = require('./auth');

exports.handler = async (event) => {
  try {
    const user = await requireUser(event);
    const body = JSON.parse(event.body || "{}");
    const { roster = [], goal = "heterogeneous", groupSize = 4 } = body;

    if (!Array.isArray(roster) || roster.length === 0) {
      return badRequest("Field 'roster' must be a non-empty array");
    }

    // naive attribute to spread by
    const copy = roster.map((s,i)=>({i, ...s}));
    // sort by score descending; tweak per goal
    copy.sort((a,b)=>(+b.score||0)-(+a.score||0));

    let groups = [];
    if (goal === "homogeneous") {
      for (let i = 0; i < copy.length; i += groupSize) {
        groups.push({ name: `Group ${groups.length+1}`, members: copy.slice(i, i+groupSize) });
      }
    } else { // heterogeneous: snake draft
      const lanes = Array.from({length: groupSize}, ()=>[]);
      copy.forEach((s,idx)=>{
        const lane = (Math.floor(idx/groupSize)%2===0) ? (idx%groupSize) : (groupSize-1-(idx%groupSize));
        lanes[lane].push(s);
      });
      const maxLen = Math.max(...lanes.map(l=>l.length));
      for (let r=0;r<maxLen;r++){
        const g = [];
        for (let c=0;c<groupSize;c++){ if(lanes[c][r]) g.push(lanes[c][r]); }
        if (g.length) groups.push({ name: `Group ${groups.length+1}`, members: g });
      }
    }

    return json(200, { uid: user.uid, groups });
  } catch (e) {
    return json(e.statusCode || 500, { error: e.message || String(e) });
  }
};
