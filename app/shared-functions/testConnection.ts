export type ConnectionHealthConnectionType =
  | "p2p_possible"
  | "host_only"
  | "no_p2p";
export type ConnectionHealthCandidateType =
  | "host"
  | "srflx"
  | "prflx"
  | "relay";
export interface ConnectionHealth {
  verdict: ConnectionHealthConnectionType;
  candidates: Record<ConnectionHealthCandidateType, boolean>;
}

/**
 * Tests the peer-to-peer connectivity by creating a WebRTC connection
 * and analyzing the ICE candidates gathered during the process.
 *
 * @returns A promise that resolves with an object containing:
 * - `verdict`: The type of connectivity ("p2p_possible", "host_only", or "no_p2p").
 * - `candidates`: An object indicating which types of candidates were found.
 *
 * The verdicts are defined as follows:
 *
 * - "p2p_possible" → STUN succeeded, public IP found. High chance P2P works.
 * - "host_only" → Only LAN IPs available. Works only on same Wi-Fi or subnet.
 * - "no_p2p" → Nothing usable. Likely symmetric NAT or blocked.
 */
export async function testP2PConnectivity() {
  return new Promise(
    (resolve: ({ verdict, candidates }: ConnectionHealth) => unknown) => {
      const pc = new RTCPeerConnection({
        iceServers: [],
      });

      const results = {
        host: false,
        srflx: false,
        prflx: false,
        relay: false,
      };

      let resolved = false;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateParts = event.candidate.candidate.split(" ");
          const typeIndex =
            candidateParts.findIndex((part) => part === "typ") + 1;

          if (typeIndex > 0 && typeIndex < candidateParts.length) {
            const type = candidateParts[typeIndex];
            if (results.hasOwnProperty(type)) {
              results[type as ConnectionHealthCandidateType] = true;
            }
          }
        } else {
          // ICE gathering complete
          if (!resolved) {
            resolved = true;
            pc.close();

            let verdict: ConnectionHealthConnectionType;
            if (results.srflx || results.prflx) {
              verdict = "p2p_possible";
            } else if (results.host) {
              verdict = "host_only";
            } else {
              verdict = "no_p2p";
            }

            resolve({
              verdict,
              candidates: results,
            });
          }
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete" && !resolved) {
          resolved = true;
          pc.close();

          let verdict: ConnectionHealthConnectionType;
          if (results.srflx || results.prflx) {
            verdict = "p2p_possible";
          } else if (results.host) {
            verdict = "host_only";
          } else {
            verdict = "no_p2p";
          }

          resolve({
            verdict,
            candidates: results,
          });
        }
      };

      // Trigger ICE gathering
      pc.createDataChannel("ping");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          console.error("Failed to create offer", err);
          if (!resolved) {
            resolved = true;
            pc.close();
            resolve({
              verdict: "no_p2p",
              candidates: results,
            });
          }
        });

      // Failsafe timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve({
            verdict: "no_p2p",
            candidates: results,
          });
        }
      }, 10000); // ICE gathering can take some time
    }
  );
}
