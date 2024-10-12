interface TreeNode {
    evaluate: () => boolean;
}

abstract class TreeBranch implements TreeNode {
    protected _nodes: TreeNode[]

    constructor() {
        this._nodes = [];
    }

    addChild(child: TreeNode) {
        this._nodes.push(child)
    }

    addChildren(children: TreeNode[]) {
        this._nodes.push(...children)
    }

    abstract evaluate(): boolean;
}


class AndBranch extends TreeBranch {
    evaluate(): boolean {
        for (const leaf of this._nodes) {
            const success = leaf.evaluate();

            if (!success) return false;
        }

        return true;
    }
}


class OrBranch extends TreeBranch {
    evaluate(): boolean {
        for (const leaf of this._nodes) {
            const success = leaf.evaluate();

            if (success) return success;
        }

        return false;
    }
}


class Leaf implements TreeNode {
    private _evaluateFn: () => boolean;

    constructor(evaluateFn: () => boolean) {
        this._evaluateFn = evaluateFn;
    }

    evaluate(): boolean {
        return this._evaluateFn();
    }
}

function createRandomConditionLeaf(threshhold: number) {
    return new Leaf(() => {
        return Math.random() > threshhold;
    });
}


export { TreeNode, AndBranch, OrBranch, Leaf, createRandomConditionLeaf }











