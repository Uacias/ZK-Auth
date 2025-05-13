import * as garaga from 'garaga';
import initACVM from '@noir-lang/acvm_js';
import initNoirC from '@noir-lang/noirc_abi';
import wasmACVM from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url';
import wasmNoirc from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url';

const zkContext = {
	ready: false,
	garaga: null as typeof garaga | null
};

export const initZk = async () => {
	if (zkContext.ready) return;
	console.log('🧠 [ZK Init] Starting...');

	await garaga.init();
	await initACVM(fetch(wasmACVM));
	await initNoirC(fetch(wasmNoirc));

	zkContext.garaga = garaga;
	zkContext.ready = true;

	console.log('✅ [ZK Init] Ready');
};

export const poseidonHash2 = async (x: bigint, y: bigint) => {
	if (!zkContext.ready) await initZk();
	return zkContext.garaga!.poseidonHashBN254(x, y);
};
