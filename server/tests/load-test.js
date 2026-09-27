import autocannon from "autocannon";

const TARGET = process.argv[2] || "http://localhost:4000/graphql";

const READ_QUERY = JSON.stringify({
  query: "{ releases { id name status steps { key completed } } }",
});

async function runReadTest(connections, duration = 15) {
  console.log(`\n=== READ TEST — ${connections} connections for ${duration}s ===`);
  const result = await autocannon({
    url: TARGET,
    connections,
    duration,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip, br",
    },
    body: READ_QUERY,
  });
  printResult(result);
  return result;
}

function printResult(result) {
  console.log(`  Requests/sec (avg):  ${result.requests.average}`);
  console.log(`  Requests/sec (max):  ${result.requests.max}`);
  console.log(`  Total requests:      ${result.requests.total}`);
  console.log(`  Latency p50:         ${result.latency.p50} ms`);
  console.log(`  Latency p99:         ${result.latency.p99} ms`);
  console.log(`  Errors:              ${result.errors}`);
  console.log(`  Non-2xx responses:   ${result.non2xx}`);
  console.log(`  Timeouts:            ${result.timeouts}`);
}

async function main() {
  console.log(`Target: ${TARGET}`);

  const concurrency = [10, 25, 50, 100, 200];

  for (const c of concurrency) {
    const result = await runReadTest(c, 15);
    if (result.non2xx > 0 || result.errors > 0 || result.timeouts > 0) {
      console.log(`\n🔴 BREAKING POINT DETECTED at ${c} concurrent connections`);
      console.log(
        `   Reasons: errors=${result.errors}, non2xx=${result.non2xx}, timeouts=${result.timeouts}`
      );
      break;
    }
  }
}

main().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});